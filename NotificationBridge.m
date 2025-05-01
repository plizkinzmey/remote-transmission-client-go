// NotificationBridge.m
#import "NotificationBridge.h"
#import <Foundation/Foundation.h>
#import <UserNotifications/UserNotifications.h>

// Для UserNotifications нужен минимум macOS 10.14
void ShowNativeNotification(const char *title, const char *message, const char *iconPath) {
    @autoreleasepool {
        NSLog(@"[NotifyBridge] Запуск ShowNativeNotification: %s | %s", title, message);
        NSString *nsTitle = [NSString stringWithUTF8String:title];
        NSString *nsMessage = [NSString stringWithUTF8String:message];
        UNMutableNotificationContent *content = [[UNMutableNotificationContent alloc] init];
        content.title = nsTitle;
        content.body = nsMessage;
        // Иконка пока не используется, можно добавить при необходимости
        UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
        dispatch_semaphore_t sem = dispatch_semaphore_create(0);
        [center requestAuthorizationWithOptions:(UNAuthorizationOptionAlert | UNAuthorizationOptionSound | UNAuthorizationOptionBadge)
                              completionHandler:^(BOOL granted, NSError * _Nullable error) {
            NSLog(@"[NotifyBridge] granted=%d, error=%@", granted, error);
            if (granted) {
                UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:[[NSUUID UUID] UUIDString] content:content trigger:nil];
                [center addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
                    NSLog(@"[NotifyBridge] addNotificationRequest error=%@", error);
                    dispatch_semaphore_signal(sem);
                }];
            } else {
                dispatch_semaphore_signal(sem);
            }
        }];
        dispatch_semaphore_wait(sem, dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)));
    }
}
