import { useCallback, useEffect, useState } from "react";

export interface AudioDevice {
  deviceId: string;
  label: string;
  groupId: string;
}

function mapAudioInputs(deviceList: MediaDeviceInfo[]): AudioDevice[] {
  return deviceList
    .filter((device) => device.kind === "audioinput")
    .map((device) => {
      let cleanLabel =
        device.label || `Microphone ${device.deviceId.slice(0, 8)}`;
      cleanLabel = cleanLabel.replace(/\s*\([^)]*\)/g, "").trim();

      return {
        deviceId: device.deviceId,
        label: cleanLabel,
        groupId: device.groupId,
      };
    });
}

export function useAudioDevices() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const loadDevicesWithoutPermission = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const deviceList = await navigator.mediaDevices.enumerateDevices();

      setDevices(mapAudioInputs(deviceList));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get audio devices",
      );
      console.error("Error getting audio devices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDevicesWithPermission = useCallback(async () => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      const tempStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      tempStream.getTracks().forEach((track) => track.stop());

      const deviceList = await navigator.mediaDevices.enumerateDevices();

      setDevices(mapAudioInputs(deviceList));
      setHasPermission(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get audio devices",
      );
      console.error("Error getting audio devices:", err);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    loadDevicesWithoutPermission();
  }, [loadDevicesWithoutPermission]);

  useEffect(() => {
    const handleDeviceChange = () => {
      if (hasPermission) {
        loadDevicesWithPermission();
      } else {
        loadDevicesWithoutPermission();
      }
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange,
      );
    };
  }, [hasPermission, loadDevicesWithPermission, loadDevicesWithoutPermission]);

  return {
    devices,
    loading,
    error,
    hasPermission,
    loadDevices: loadDevicesWithPermission,
  };
}
