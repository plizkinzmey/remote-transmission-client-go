//go:build darwin
// +build darwin

package main

/*
#cgo CFLAGS: -mmacosx-version-min=10.14 -x objective-c
#cgo LDFLAGS: -mmacosx-version-min=10.14 -framework Foundation -framework UserNotifications
#include <stdlib.h>
#include "NotificationBridge.h"
*/
import "C"
import "unsafe"

func showNativeNotification(title, message, iconPath string) {
	ctitle := C.CString(title)
	cmessage := C.CString(message)
	cicon := C.CString(iconPath)
	defer C.free(unsafe.Pointer(ctitle))
	defer C.free(unsafe.Pointer(cmessage))
	defer C.free(unsafe.Pointer(cicon))
	C.ShowNativeNotification(ctitle, cmessage, cicon)
}
