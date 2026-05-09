package audio

import (
	"encoding/binary"
	"fmt"
	"os"

	"github.com/gen2brain/malgo"
	"github.com/go-audio/audio"
	"github.com/go-audio/wav"
)

type Recorder struct {
	Ctx         *malgo.AllocatedContext
	Device      *malgo.Device
	Buffer      []byte
	IsRecording bool
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

func (r *Recorder) Start(deviceName string) error {
	if r.IsRecording {
		return fmt.Errorf("ya hay una grabación en curso")
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
		if r.IsRecording {
			r.Buffer = append(r.Buffer, pSampleIn...)
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
	if !r.IsRecording || r.Device == nil {
		return nil, fmt.Errorf("no hay grabación activa")
	}

	r.IsRecording = false
	r.Device.Stop()
	r.Device.Uninit()
	r.Device = nil

	return r.Buffer, nil
}

func SaveWav(path string, buffer []byte) error {
	f, err := os.Create(path)
	if err != nil {
		return err
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
		return err
	}

	return encoder.Close()
}

func (r *Recorder) Shutdown() {
	if r.Device != nil {
		r.Device.Uninit()
	}
	if r.Ctx != nil {
		r.Ctx.Uninit()
		r.Ctx.Free()
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
