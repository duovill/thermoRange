#ifndef TRS_OPENCV_QRCODE_WORKER_H_
#define TRS_OPENCV_QRCODE_WORKER_H_

#include <napi.h>

Napi::Value ReadQrCodeAsync(const Napi::CallbackInfo& info);

#endif  // TRS_OPENCV_QRCODE_WORKER_H_
