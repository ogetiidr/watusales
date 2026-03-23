import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, RefreshCw, X, CheckCircle, AlertTriangle, RotateCcw, Loader2, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Mode = "manual" | "capture" | "analyzing" | "review";

interface ScanResult {
  imageQuality: "clear" | "blurry" | "no_imei";
  imei: string | null;
  model: string | null;
  confidence: "high" | "medium" | "low";
  warning: string | null;
}

interface IMEIScannerProps {
  value: string;
  onChange: (imei: string) => void;
  onModelChange?: (model: string) => void;
  disabled?: boolean;
}

export function IMEIScanner({ value, onChange, onModelChange, disabled }: IMEIScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<Mode>("manual");
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [mismatch, setMismatch] = useState(false);
  const [photoImei, setPhotoImei] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async (deviceId?: string) => {
    setCameraError(null);
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === "videoinput");
      if (videoDevices.length === 0) {
        setCameraError("No camera found on this device.");
        return false;
      }
      setCameras(videoDevices);
      const targetId = deviceId || selectedCamera || videoDevices[0].deviceId;
      if (!selectedCamera) setSelectedCamera(targetId);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: targetId ? { exact: targetId } : undefined,
          facingMode: targetId ? undefined : { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      return true;
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setCameraError("Camera permission denied. Allow camera access in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Could not start camera: " + (err.message || "Unknown error"));
      }
      return false;
    }
  }, [selectedCamera]);

  const openCamera = async () => {
    setMode("capture");
    setCapturedPhoto(null);
    setScanResult(null);
    setTimeout(() => startCamera(), 100);
  };

  const closeCamera = () => {
    stopCamera();
    setMode("manual");
  };

  const switchCamera = async () => {
    const idx = cameras.findIndex(c => c.deviceId === selectedCamera);
    const next = cameras[(idx + 1) % cameras.length];
    setSelectedCamera(next.deviceId);
    stopCamera();
    setTimeout(() => startCamera(next.deviceId), 300);
  };

  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedPhoto(dataUrl);
    stopCamera();
    setMode("analyzing");

    try {
      const resp = await fetch("/api/scan/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ image: dataUrl }),
      });
      const result: ScanResult = await resp.json();
      setScanResult(result);
      setMode("review");
    } catch {
      setScanResult({
        imageQuality: "no_imei",
        imei: null,
        model: null,
        confidence: "low",
        warning: "Failed to analyze image. Please enter IMEI manually.",
      });
      setMode("review");
    }
  };

  const acceptResult = () => {
    if (scanResult?.imei) {
      if (value && value.length >= 14 && value !== scanResult.imei) {
        setMismatch(true);
      } else {
        setMismatch(false);
      }
      onChange(scanResult.imei);
      setPhotoImei(scanResult.imei);
    }
    if (scanResult?.model && onModelChange) {
      onModelChange(scanResult.model);
    }
    setMode("manual");
  };

  const retakePhoto = async () => {
    setCapturedPhoto(null);
    setScanResult(null);
    setMode("capture");
    setTimeout(() => startCamera(), 100);
  };

  const handleManualChange = (v: string) => {
    const cleaned = v.replace(/\D/g, "").slice(0, 15);
    onChange(cleaned);
    if (photoImei && cleaned.length >= 14) {
      setMismatch(cleaned !== photoImei);
    } else {
      setMismatch(false);
    }
  };

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  return (
    <div className="space-y-3">
      {/* Manual input mode */}
      {mode === "manual" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={value}
              onChange={e => handleManualChange(e.target.value)}
              placeholder="Enter 15-digit IMEI"
              className={cn(
                "rounded-xl h-12 font-mono text-lg tracking-widest text-center flex-1",
                mismatch && "border-amber-500 focus-visible:ring-amber-500"
              )}
              maxLength={15}
              disabled={disabled}
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-xl h-12 px-4 gap-2 shrink-0 border-primary/40 hover:bg-primary/5"
              onClick={openCamera}
              disabled={disabled}
              title="Take photo of device box"
            >
              <Camera className="w-5 h-5 text-primary" />
              <span className="hidden sm:inline text-primary font-medium">Photo</span>
            </Button>
          </div>

          {mismatch && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <span className="font-semibold">IMEI mismatch!</span> The IMEI you typed (<span className="font-mono">{value}</span>) does not match the one in the photo (<span className="font-mono">{photoImei}</span>). Double-check the number.
              </div>
            </div>
          )}

          {photoImei && !mismatch && value === photoImei && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                IMEI verified from photo
              </span>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Type IMEI manually or tap Photo to scan the device box
          </p>
        </div>
      )}

      {/* Camera capture mode */}
      {mode === "capture" && (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
            {/* Overlay guide */}
            {!cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="w-3/4 h-1/2 border-2 border-white/70 rounded-xl relative">
                  <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-4 border-l-4 border-white rounded-tl-lg" />
                  <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-4 border-r-4 border-white rounded-tr-lg" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-4 border-l-4 border-white rounded-bl-lg" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-4 border-r-4 border-white rounded-br-lg" />
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 text-center">
                    <span className="text-white/90 text-xs bg-black/40 px-3 py-1 rounded-full">
                      Point at the device label or box
                    </span>
                  </div>
                </div>
              </div>
            )}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/85 p-4">
                <div className="text-center text-white space-y-2">
                  <CameraOff className="w-10 h-10 mx-auto text-red-400" />
                  <p className="text-sm text-red-300">{cameraError}</p>
                  <Button size="sm" variant="outline" className="mt-2 text-white border-white/40" onClick={closeCamera}>
                    Type Manually
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl gap-2"
              onClick={closeCamera}
            >
              <X className="w-4 h-4" />
              Cancel
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
            {!cameraError && (
              <Button
                type="button"
                className="flex-1 rounded-xl gap-2 h-12 text-base font-semibold"
                onClick={takePhoto}
              >
                <Camera className="w-5 h-5" />
                Take Photo
              </Button>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Analyzing mode */}
      {mode === "analyzing" && (
        <div className="space-y-3">
          {capturedPhoto && (
            <div className="rounded-2xl overflow-hidden border border-border" style={{ aspectRatio: "16/9" }}>
              <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex items-center justify-center gap-3 py-4 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Reading IMEI from photo...</span>
          </div>
        </div>
      )}

      {/* Review mode */}
      {mode === "review" && scanResult && (
        <div className="space-y-3">
          {capturedPhoto && (
            <div className="rounded-2xl overflow-hidden border border-border relative" style={{ aspectRatio: "16/9" }}>
              <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
              {scanResult.imageQuality === "blurry" && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center text-white space-y-1">
                    <ImageOff className="w-8 h-8 mx-auto text-amber-400" />
                    <p className="text-sm font-medium text-amber-300">Image too blurry</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Warning message */}
          {scanResult.warning && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300">{scanResult.warning}</p>
            </div>
          )}

          {/* Extracted data */}
          {scanResult.imei && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">IMEI Detected</span>
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full ml-auto",
                  scanResult.confidence === "high" ? "bg-emerald-200 text-emerald-800" :
                  scanResult.confidence === "medium" ? "bg-yellow-200 text-yellow-800" :
                  "bg-red-100 text-red-700"
                )}>
                  {scanResult.confidence} confidence
                </span>
              </div>
              <div className="font-mono text-lg font-bold text-center tracking-widest text-foreground">
                {scanResult.imei}
              </div>
              {scanResult.model && (
                <div className="text-xs text-center text-muted-foreground">
                  Model: <span className="font-medium text-foreground">{scanResult.model}</span>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl gap-2"
              onClick={retakePhoto}
            >
              <RotateCcw className="w-4 h-4" />
              Retake
            </Button>
            {scanResult.imei ? (
              <Button
                type="button"
                className="flex-1 rounded-xl gap-2"
                onClick={acceptResult}
              >
                <CheckCircle className="w-4 h-4" />
                Use This IMEI
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl gap-2"
                onClick={closeCamera}
              >
                Enter Manually
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
