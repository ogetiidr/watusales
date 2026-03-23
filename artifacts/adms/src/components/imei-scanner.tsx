import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/browser";
import { Camera, CameraOff, RefreshCw, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface IMEIScannerProps {
  value: string;
  onChange: (imei: string) => void;
  disabled?: boolean;
}

export function IMEIScanner({ value, onChange, disabled }: IMEIScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [mode, setMode] = useState<"manual" | "camera">("manual");
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (readerRef.current) {
      try { readerRef.current.reset(); } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  const startCamera = useCallback(async (deviceId?: string) => {
    setCameraError(null);
    setScanning(true);
    setLastScanned(null);

    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (devices.length === 0) {
        setCameraError("No camera found on this device.");
        setScanning(false);
        return;
      }
      setCameras(devices);

      const targetDeviceId = deviceId || selectedCamera || devices[0].deviceId;
      if (!selectedCamera) setSelectedCamera(targetDeviceId);

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: targetDeviceId ? { exact: targetDeviceId } : undefined,
          facingMode: targetDeviceId ? undefined : { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      reader.decodeFromStream(stream, videoRef.current!, (result, err) => {
        if (result) {
          const text = result.getText().replace(/\D/g, "");
          if (text.length >= 14 && text.length <= 16) {
            const imei = text.slice(0, 15);
            setLastScanned(imei);
            onChange(imei);
            stopCamera();
            setMode("manual");
          }
        }
      });
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Could not start camera: " + (err.message || "Unknown error"));
      }
      setScanning(false);
    }
  }, [selectedCamera, onChange, stopCamera]);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  const switchCamera = async () => {
    const currentIdx = cameras.findIndex(c => c.deviceId === selectedCamera);
    const nextCamera = cameras[(currentIdx + 1) % cameras.length];
    setSelectedCamera(nextCamera.deviceId);
    stopCamera();
    setTimeout(() => startCamera(nextCamera.deviceId), 300);
  };

  const openCamera = () => {
    setMode("camera");
    setTimeout(() => startCamera(), 100);
  };

  const closeCamera = () => {
    stopCamera();
    setMode("manual");
  };

  return (
    <div className="space-y-3">
      {mode === "manual" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={value}
              onChange={e => onChange(e.target.value.replace(/\D/g, "").slice(0, 15))}
              placeholder="Enter 15-digit IMEI"
              className="rounded-xl h-12 font-mono text-lg tracking-widest text-center flex-1"
              maxLength={15}
              disabled={disabled}
              autoFocus
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-xl h-12 px-4 gap-2 shrink-0"
              onClick={openCamera}
              disabled={disabled}
              title="Scan IMEI barcode"
            >
              <Camera className="w-5 h-5" />
              <span className="hidden sm:inline">Scan</span>
            </Button>
          </div>
          {lastScanned && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 text-center">
              Scanned: <span className="font-mono font-bold">{lastScanned}</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground text-center">
            Type IMEI manually or click Scan to use your camera
          </p>
        </div>
      )}

      {mode === "camera" && (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video w-full">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-28 border-2 border-primary rounded-xl relative">
                  <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/70 animate-pulse" />
                </div>
              </div>
            )}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
                <div className="text-center text-white">
                  <CameraOff className="w-10 h-10 mx-auto mb-2 text-red-400" />
                  <p className="text-sm text-red-300">{cameraError}</p>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Point camera at the IMEI barcode on the device or box
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl gap-2"
              onClick={closeCamera}
            >
              <Keyboard className="w-4 h-4" />
              Type Manually
            </Button>
            {cameras.length > 1 && (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl gap-2"
                onClick={switchCamera}
              >
                <RefreshCw className="w-4 h-4" />
                Flip
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
