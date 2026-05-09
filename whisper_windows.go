//go:build windows && !linux

package main

/*
#cgo CFLAGS: -I${SRCDIR}/lib/whisper.cpp/include -I${SRCDIR}/lib/whisper.cpp/ggml/include
#cgo LDFLAGS: -L${SRCDIR}/lib/windows -L${SRCDIR}/lib/whisper.cpp/build-win/src -L${SRCDIR}/lib/whisper.cpp/build-win/ggml/src -lwhisper -lggml -lggml-base -lggml-cpu -ltokenizers -lws2_32 -luserenv -lntdll -lbcrypt -ladvapi32 -lkernel32 -lstdc++ -lm
*/
import "C"
