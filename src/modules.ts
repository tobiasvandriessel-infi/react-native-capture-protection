import {
  Image,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import {
  CaptureProtectionAndroidNativeModules,
  CaptureProtectionFunction,
  CaptureProtectionIOSNativeModules,
  ContentMode,
} from './type';

const isPlatformSupported = Platform.OS === 'ios' || Platform.OS === 'android';

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const CaptureProtectionModule = isPlatformSupported
  ? isTurboModuleEnabled
    ? require('./spec/NativeCaptureProtection').default
    : NativeModules?.CaptureProtection
  : null;

const CaptureProtectionAndroidModule =
  CaptureProtectionModule as CaptureProtectionAndroidNativeModules;
const CaptureProtectionIOSModule =
  CaptureProtectionModule as CaptureProtectionIOSNativeModules;

const CaptureNotificationEmitter = isPlatformSupported
  ? new NativeEventEmitter(CaptureProtectionModule)
  : undefined;

const CaptureProtectionEventType = 'CaptureProtectionListener' as const;

const allow: CaptureProtectionFunction['allow'] = async (option) => {
  if (!isPlatformSupported) {
    console.warn(
      `[react-native-capture-protection] Platform ${Platform.OS} not supported`
    );
    return;
  }
  if (Platform.OS === 'android') {
    return await CaptureProtectionAndroidModule?.allow?.();
  }
  if (Platform.OS === 'ios') {
    const {
      record = false,
      appSwitcher = false,
      screenshot = false,
    } = option ?? {
      record: true,
      appSwitcher: true,
      screenshot: true,
    };

    if (screenshot) {
      await CaptureProtectionIOSModule?.allowScreenshot?.();
    }

    if (appSwitcher) {
      await CaptureProtectionIOSModule?.allowAppSwitcher?.();
    }

    if (record) {
      await CaptureProtectionIOSModule?.allowScreenRecord?.();
    }
  }
};

const prevent: CaptureProtectionFunction['prevent'] = async (option) => {
  if (!isPlatformSupported) {
    console.warn(
      `[react-native-capture-protection] Platform ${Platform.OS} not supported`
    );
    return;
  }
  if (Platform.OS === 'android') {
    return await CaptureProtectionAndroidModule?.prevent?.();
  }
  if (Platform.OS === 'ios') {
    const {
      record = false,
      appSwitcher = false,
      screenshot = false,
    } = option ?? {
      record: true,
      appSwitcher: true,
      screenshot: true,
    };

    if (screenshot) {
      await CaptureProtectionIOSModule?.preventScreenshot?.();
    }

    if (appSwitcher) {
      if (typeof appSwitcher === 'boolean') {
        await CaptureProtectionIOSModule?.preventAppSwitcher?.();
      } else if (typeof appSwitcher === 'object') {
        if ('image' in appSwitcher) {
          await CaptureProtectionIOSModule?.preventAppSwitcherWithImage?.(
            Image.resolveAssetSource(appSwitcher.image as unknown as number),
            appSwitcher?.backgroundColor ?? '#ffffff',
            appSwitcher?.contentMode ?? ContentMode.scaleAspectFit
          );
        } else {
          await CaptureProtectionIOSModule?.preventAppSwitcherWithText?.(
            appSwitcher.text,
            appSwitcher?.textColor,
            appSwitcher?.backgroundColor
          );
        }
      }
    }

    if (record) {
      if (typeof record === 'boolean') {
        await CaptureProtectionIOSModule?.preventScreenRecord?.();
      } else if (typeof record === 'object') {
        if ('image' in record) {
          await CaptureProtectionIOSModule?.preventScreenRecordWithImage?.(
            Image.resolveAssetSource(record.image as unknown as number),
            record?.backgroundColor ?? '#ffffff',
            record?.contentMode ?? ContentMode.scaleAspectFit
          );
        } else {
          await CaptureProtectionIOSModule?.preventScreenRecordWithText?.(
            record.text,
            record?.textColor,
            record?.backgroundColor
          );
        }
      }
    }
  }
};

const protectionStatus: CaptureProtectionFunction['protectionStatus'] =
  async () => {
    if (!isPlatformSupported) {
      console.warn(
        `[react-native-capture-protection] Platform ${Platform.OS} not supported`
      );
      return {
        record: undefined,
        appSwitcher: undefined,
        screenshot: undefined,
      };
    }
    if (Platform.OS === 'android') {
      const status = await CaptureProtectionAndroidModule?.protectionStatus?.();
      return {
        record: status,
        appSwitcher: status,
        screenshot: status,
      };
    }
    if (Platform.OS === 'ios') {
      return await CaptureProtectionIOSModule?.protectionStatus?.();
    }
    return { record: undefined, appSwitcher: undefined, screenshot: undefined };
  };

const hasListener: CaptureProtectionFunction['hasListener'] = async () => {
  if (!isPlatformSupported) {
    console.warn(
      `[react-native-capture-protection] Platform ${Platform.OS} not supported`
    );
    return undefined;
  }
  if (Platform.OS === 'android') {
    return await CaptureProtectionAndroidModule?.hasListener?.();
  }
  if (Platform.OS === 'ios') {
    return await CaptureProtectionIOSModule?.hasListener?.();
  }
  return undefined;
};

const addListener: CaptureProtectionFunction['addListener'] = (callback) => {
  if (!isPlatformSupported) {
    console.warn(
      `[react-native-capture-protection] Platform ${Platform.OS} not supported`
    );
    return undefined;
  }
  return CaptureNotificationEmitter?.addListener?.(
    CaptureProtectionEventType,
    callback
  );
};

const removeListener: CaptureProtectionFunction['removeListener'] = async (
  emitter
) => {
  if (!isPlatformSupported) {
    console.warn(
      `[react-native-capture-protection] Platform ${Platform.OS} not supported`
    );
    return;
  }
  if (emitter) {
    emitter.remove();
  }
};

const isScreenRecording: CaptureProtectionFunction['isScreenRecording'] =
  async () => {
    if (!isPlatformSupported) {
      console.warn(
        `[react-native-capture-protection] Platform ${Platform.OS} not supported`
      );
      return undefined;
    }
    if (Platform.OS === 'android') {
      return await CaptureProtectionAndroidModule?.isScreenRecording?.();
    }
    if (Platform.OS === 'ios') {
      return await CaptureProtectionIOSModule?.isScreenRecording?.();
    }
    return undefined;
  };

const requestPermission: CaptureProtectionFunction['requestPermission'] =
  async () => {
    if (Platform.OS !== 'android') {
      console.warn(
        '[react-native-capture-protection] requestPermission is only available on Android'
      );
      return false;
    }

    try {
      return await CaptureProtectionAndroidModule?.requestPermission?.();
    } catch (e) {
      console.error(
        '[react-native-capture-protection] requestPermission throw error',
        e
      );
      return false;
    }
  };

export const CaptureProtection: CaptureProtectionFunction = {
  addListener,
  hasListener,
  isScreenRecording,
  requestPermission,
  allow,
  prevent,
  removeListener,
  protectionStatus,
};
