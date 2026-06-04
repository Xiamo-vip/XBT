import React, { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';

interface PhotoInputProps {
  files: File[];
  previewUrls: string[];
  disabled?: boolean;
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
}

export const PhotoInput: React.FC<PhotoInputProps> = ({
  files,
  previewUrls,
  disabled = false,
  onAdd,
  onRemove,
  onClear,
}) => {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files || []);
    event.target.value = '';
    if (nextFiles.length > 0) {
      onAdd(nextFiles);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const openCamera = async () => {
    if (disabled) return;
    setCameraError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
        },
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch {
      setCameraError('无法打开摄像头，请检查浏览器权限');
      cameraInputRef.current?.click();
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError('摄像头画面尚未就绪');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setCameraError('拍照失败，请重试');
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError('拍照失败，请重试');
        return;
      }

      const file = new File([blob], `photo-sign-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onAdd([file]);
      stopCamera();
    }, 'image/jpeg', 0.92);
  };

  useEffect(() => {
    if (!isCameraOpen || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {
      setCameraError('摄像头启动失败，请重试');
    });
  }, [isCameraOpen]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  return (
    <div className="w-full space-y-4 py-2">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">拍照签到</h3>
          <p className="text-[10px] text-slate-400 font-medium mt-1 truncate">
            {files.length > 0 ? `已选择 ${files.length} 张照片` : '可拍照或选择多张照片'}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-inner">
          <Camera size={24} />
        </div>
      </div>

      {previewUrls.length > 0 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {previewUrls.map((url, index) => (
              <div key={url} className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100 border border-slate-100">
                <img src={url} alt={`签到照片预览 ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRemove(index)}
                  className="absolute right-1.5 top-1.5 w-7 h-7 rounded-full bg-slate-900/70 text-white flex items-center justify-center backdrop-blur-md disabled:opacity-50"
                  title="移除照片"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={onClear}
            className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold disabled:opacity-50"
          >
            清空照片
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => galleryInputRef.current?.click()}
          className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-blue-100 bg-blue-50/40 text-blue-600 flex flex-col items-center justify-center gap-3 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          <ImagePlus size={36} />
          <span className="text-sm font-black">批量选择照片</span>
        </button>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={openCamera}
          className="py-3 rounded-xl bg-blue-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none"
        >
          <Camera size={16} />
          拍照添加
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => galleryInputRef.current?.click()}
          className="py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ImagePlus size={16} />
          批量选择
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      {isCameraOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/80 backdrop-blur-sm p-0">
          <div className="w-full max-w-[480px] rounded-t-[2rem] bg-white p-4 pb-[calc(16px+var(--sab))] shadow-2xl">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-slate-950">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              {cameraError && (
                <div className="absolute left-3 right-3 top-3 rounded-xl bg-rose-500/90 px-3 py-2 text-xs font-bold text-white">
                  {cameraError}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                type="button"
                onClick={stopCamera}
                className="py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold"
              >
                取消
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="py-3 rounded-xl bg-blue-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
              >
                <Camera size={16} />
                拍照
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
