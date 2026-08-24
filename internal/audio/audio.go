package audio

import (
	"encoding/binary"
	"fmt"
	"math"
	"os"
	"sync"
	"time"

	"github.com/gen2brain/malgo"
	"github.com/go-audio/audio"
	"github.com/go-audio/wav"
)

type LevelCallback func(level int, peak int)

type Recorder struct {
	Ctx           *malgo.AllocatedContext
	Device        *malgo.Device
	TestDevice    *malgo.Device
	Buffer        []byte
	IsRecording   bool
	IsTesting     bool
	OnLevel       LevelCallback
	lastLevelTime time.Time
	mu            sync.Mutex
}

func NewRecorder() (*Recorder, error) {
	mctx, err := malgo.InitContext(nil, malgo.ContextConfig{}, nil)
	if err != nil {
		return nil, err
	}
	return &Recorder{
		Ctx: mctx,
	}, nil
}

func (r *Recorder) SetLevelCallback(cb LevelCallback) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.OnLevel = cb
}

func CalculatePCMLevel(pSampleIn []byte) (int, int) {
	sampleCount := len(pSampleIn) / 2
	if sampleCount == 0 {
		return 0, 0
	}

	maxPeak := 0
	sumSquares := 0.0
	for i := 0; i < sampleCount; i++ {
		sample := int(int16(binary.LittleEndian.Uint16(pSampleIn[i*2 : i*2+2])))
		if sample < 0 {
			sample = -sample
		}
		if sample > maxPeak {
			maxPeak = sample
		}
		norm := float64(sample) / 32768.0
		sumSquares += norm * norm
	}

	rms := math.Sqrt(sumSquares / float64(sampleCount))
	// Escalar RMS de forma responsiva para voz (RMS de 0.35 representa volumen alto)
	level := int(rms * 280.0)
	if level > 100 {
		level = 100
	}
	if maxPeak > 200 && level == 0 {
		level = 2
	}
	return level, maxPeak
}

func (r *Recorder) Start(deviceName string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.IsRecording {
		return fmt.Errorf("ya hay una grabación en curso")
	}

	// Detener monitor/test si estaba corriendo
	if r.IsTesting && r.TestDevice != nil {
		r.TestDevice.Stop()
		r.TestDevice.Uninit()
		r.TestDevice = nil
		r.IsTesting = false
	}

	r.Buffer = make([]byte, 0, 16000*2*10)

	deviceConfig := malgo.DefaultDeviceConfig(malgo.Capture)
	deviceConfig.Capture.Format = malgo.FormatS16
	deviceConfig.Capture.Channels = 1
	deviceConfig.SampleRate = 16000
	deviceConfig.Alsa.NoMMap = 1

	devices, err := r.Ctx.Devices(malgo.Capture)
	if err == nil {
		fmt.Println("🔍 Dispositivos de audio (Capture) detectados:")
		for _, d := range devices {
			fmt.Printf("   - [%s] (ID: %v)\n", d.Name(), d.ID)
			if d.Name() == deviceName {
				deviceConfig.Capture.DeviceID = d.ID.Pointer()
				fmt.Printf("   ✅ Seleccionado por nombre: %s\n", d.Name())
				break
			}
		}
	}

	onData := func(pSample2out, pSampleIn []byte, framecount uint32) {
		r.mu.Lock()
		isRec := r.IsRecording
		cb := r.OnLevel
		r.mu.Unlock()

		if isRec {
			r.mu.Lock()
			r.Buffer = append(r.Buffer, pSampleIn...)
			r.mu.Unlock()
		}

		if cb != nil {
			now := time.Now()
			if now.Sub(r.lastLevelTime) >= 40*time.Millisecond {
				r.lastLevelTime = now
				level, peak := CalculatePCMLevel(pSampleIn)
				cb(level, peak)
			}
		}
	}

	var errInit error
	r.Device, errInit = malgo.InitDevice(r.Ctx.Context, deviceConfig, malgo.DeviceCallbacks{
		Data: onData,
	})
	if errInit != nil {
		return errInit
	}

	if err := r.Device.Start(); err != nil {
		return err
	}

	r.IsRecording = true
	return nil
}

func (r *Recorder) Stop() ([]byte, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if !r.IsRecording || r.Device == nil {
		return nil, fmt.Errorf("no hay grabación activa")
	}

	r.IsRecording = false
	r.Device.Stop()
	r.Device.Uninit()
	r.Device = nil

	buf := make([]byte, len(r.Buffer))
	copy(buf, r.Buffer)
	r.Buffer = nil

	return buf, nil
}

func (r *Recorder) StartMonitor(deviceName string, cb LevelCallback) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.IsRecording {
		return fmt.Errorf("grabación en curso, no se puede iniciar prueba simultánea")
	}

	if r.IsTesting && r.TestDevice != nil {
		r.TestDevice.Stop()
		r.TestDevice.Uninit()
		r.TestDevice = nil
		r.IsTesting = false
	}

	r.OnLevel = cb

	deviceConfig := malgo.DefaultDeviceConfig(malgo.Capture)
	deviceConfig.Capture.Format = malgo.FormatS16
	deviceConfig.Capture.Channels = 1
	deviceConfig.SampleRate = 16000
	deviceConfig.Alsa.NoMMap = 1

	devices, err := r.Ctx.Devices(malgo.Capture)
	if err == nil {
		for _, d := range devices {
			if d.Name() == deviceName {
				deviceConfig.Capture.DeviceID = d.ID.Pointer()
				break
			}
		}
	}

	onData := func(pSample2out, pSampleIn []byte, framecount uint32) {
		r.mu.Lock()
		callback := r.OnLevel
		isTest := r.IsTesting
		r.mu.Unlock()

		if isTest && callback != nil {
			now := time.Now()
			if now.Sub(r.lastLevelTime) >= 40*time.Millisecond {
				r.lastLevelTime = now
				level, peak := CalculatePCMLevel(pSampleIn)
				callback(level, peak)
			}
		}
	}

	var errInit error
	r.TestDevice, errInit = malgo.InitDevice(r.Ctx.Context, deviceConfig, malgo.DeviceCallbacks{
		Data: onData,
	})
	if errInit != nil {
		return errInit
	}

	if err := r.TestDevice.Start(); err != nil {
		return err
	}

	r.IsTesting = true
	return nil
}

func (r *Recorder) StopMonitor() error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if !r.IsTesting || r.TestDevice == nil {
		return nil
	}

	r.IsTesting = false
	r.TestDevice.Stop()
	r.TestDevice.Uninit()
	r.TestDevice = nil
	r.OnLevel = nil

	return nil
}

func SaveWav(path string, buffer []byte) error {
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return fmt.Errorf("error creando directorio para audio (%s): %w", filepath.Dir(path), err)
	}

	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("error creando archivo WAV (%s): %w", path, err)
	}
	defer f.Close()

	encoder := wav.NewEncoder(f, 16000, 16, 1, 1)
	samplesCount := len(buffer) / 2
	samples := make([]int, samplesCount)
	for i := 0; i < samplesCount; i++ {
		samples[i] = int(int16(binary.LittleEndian.Uint16(buffer[i*2 : i*2+2])))
	}

	buf := &audio.IntBuffer{
		Data: samples,
		Format: &audio.Format{
			NumChannels: 1,
			SampleRate:  16000,
		},
		SourceBitDepth: 16,
	}

	if err := encoder.Write(buf); err != nil {
		return fmt.Errorf("error escribiendo samples WAV: %w", err)
	}

	if err := encoder.Close(); err != nil {
		return fmt.Errorf("error cerrando encoder WAV: %w", err)
	}

	return nil
}

func (r *Recorder) Shutdown() {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.TestDevice != nil {
		r.TestDevice.Stop()
		r.TestDevice.Uninit()
		r.TestDevice = nil
	}
	if r.Device != nil {
		r.Device.Stop()
		r.Device.Uninit()
		r.Device = nil
	}
	if r.Ctx != nil {
		r.Ctx.Uninit()
		r.Ctx.Free()
		r.Ctx = nil
	}
}

func (r *Recorder) GetDevices() ([]string, error) {
	devices, err := r.Ctx.Devices(malgo.Capture)
	if err != nil {
		return nil, err
	}
	var names []string
	for _, d := range devices {
		names = append(names, d.Name())
	}
	return names, nil
}

