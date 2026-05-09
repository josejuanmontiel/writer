//go:build darwin
package main

/*
#cgo CFLAGS: -I${SRCDIR}/lib/whisper.cpp/include -I${SRCDIR}/lib/whisper.cpp/ggml/include
#cgo LDFLAGS: -L${SRCDIR}/lib/whisper.cpp/build/src -L${SRCDIR}/lib/whisper.cpp/build/ggml/src -L${SRCDIR}/lib/tokenizers -lwhisper -lggml -lggml-base -lggml-cpu -lggml-metal -lggml-blas -framework Accelerate -framework Metal -framework Foundation -framework CoreGraphics -ltokenizers -lstdc++ -lm
*/
import "C"
