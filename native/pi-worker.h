#ifndef TRS_PI_WORKER_H_
#define TRS_PI_WORKER_H_

#include <napi.h>

Napi::Value CalculatePiAsync(const Napi::CallbackInfo& info);

#endif  // TRS_PI_WORKER_H_
