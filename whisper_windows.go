//go:build windows && !linux

package main

/*
#cgo CFLAGS: -I${SRCDIR}/lib/whisper.cpp/include -I${SRCDIR}/lib/whisper.cpp/ggml/include
#cgo LDFLAGS: -L${SRCDIR}/lib/windows -lwhisper -lggml -lggml-base -lggml-cpu -ltokenizers -lws2_32 -luserenv -lntdll -lbcrypt -ladvapi32 -lkernel32 -lstdc++ -static-libstdc++ -static-libgcc -lm
*/
import "C"
