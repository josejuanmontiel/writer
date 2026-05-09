//go:build linux

package main

/*
#cgo CFLAGS: -I${SRCDIR}/lib/whisper.cpp/include -I${SRCDIR}/lib/whisper.cpp/ggml/include
#cgo LDFLAGS: -L${SRCDIR}/lib/whisper.cpp/build/src -L${SRCDIR}/lib/whisper.cpp/build/ggml/src -lwhisper -lggml -lggml-cpu -lstdc++ -lm -L${SRCDIR}/lib/tokenizers
*/
import "C"
