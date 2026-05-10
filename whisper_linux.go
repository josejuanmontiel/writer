//go:build linux && !windows && !darwin

package main

/*
#cgo CFLAGS: -I${SRCDIR}/lib/whisper.cpp/include -I${SRCDIR}/lib/whisper.cpp/ggml/include
#cgo LDFLAGS: -L${SRCDIR}/lib/whisper.cpp/build/src -L${SRCDIR}/lib/whisper.cpp/build/ggml/src -L${SRCDIR}/lib/onnxruntime/lib -L${SRCDIR}/lib/tokenizers -lwhisper -lggml -lggml-base -lggml-cpu -ltokenizers -lstdc++ -static-libstdc++ -static-libgcc -lm -fopenmp
*/
import "C"
