#!/bin/bash
# scripts/linker_wrapper.sh
#
# This script is a wrapper for the external linker used by Go/CGO.
# It intercepts linker arguments and wraps dynamic libraries (like -lstdc++ and -lgcc)
# in static linking flags (-Wl,-Bstatic ... -Wl,-Bdynamic) to force them to be statically linked.
# This prevents runtime dependencies on libstdc++-6.dll (Windows) and libstdc++.so.6 (Linux)
# without requiring manual modification of read-only cached Go package CGO directives.
#
# Usage in Makefile:
#   REAL_CC="x86_64-w64-mingw32-gcc" wails build -ldflags "-extld $(PWD)/scripts/linker_wrapper.sh"

REAL_COMPILER="${REAL_CC:-gcc}"
args=()

# Log the invocation
echo "=== LINKER WRAPPER RUN ===" >> scratch/linker_run.log
echo "$@" >> scratch/linker_run.log

for arg in "$@"; do
    if [ "$arg" = "-lstdc++" ]; then
        args+=("-Wl,-Bstatic" "-lstdc++" "-Wl,-Bdynamic")
    elif [ "$arg" = "-lgcc_s" ] || [ "$arg" = "-lgcc" ]; then
        args+=("-Wl,-Bstatic" "$arg" "-Wl,-Bdynamic")
    else
        args+=("$arg")
    fi
done

exec "$REAL_COMPILER" "${args[@]}"
