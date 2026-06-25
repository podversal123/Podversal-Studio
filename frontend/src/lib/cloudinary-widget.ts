// Shared Cloudinary Upload Widget utility
// Handles script loading reliably before opening the widget

let _ready = false;

function loadWidget(): Promise<void> {
  if (_ready || (window as any).cloudinary) { _ready = true; return Promise.resolve(); }

  return new Promise((resolve, reject) => {
    const existing = document.getElementById('cld-widget-script') as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).cloudinary) { _ready = true; resolve(); return; }
      existing.addEventListener('load', () => { _ready = true; resolve(); });
      existing.addEventListener('error', () => reject(new Error('Script load failed')));
      return;
    }
    const s = document.createElement('script');
    s.id  = 'cld-widget-script';
    s.src = 'https://upload-widget.cloudinary.com/global/all.js';
    s.onload  = () => { _ready = true; resolve(); };
    s.onerror = () => reject(new Error('Script load failed'));
    document.body.appendChild(s);
  });
}

export interface CldUploadResult {
  secure_url:        string;
  original_filename: string;
  thumbnail_url?:    string;
  public_id:         string;
  resource_type:     string;
}

export interface CldUploadOptions {
  folder?:        string;
  resourceType?:  'image' | 'video' | 'auto';
  multiple?:      boolean;
  sources?:       string[];
}

export async function cldUpload(
  opts: CldUploadOptions,
  onSuccess: (result: CldUploadResult) => void,
  onError?:  () => void,
): Promise<void> {
  try {
    await loadWidget();
  } catch {
    onError?.();
    return;
  }

  const cloudName   = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'podversal_uploads';

  if (!cloudName) {
    console.error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME not set');
    onError?.();
    return;
  }

  (window as any).cloudinary.openUploadWidget(
    {
      cloud_name:    cloudName,
      upload_preset: uploadPreset,
      sources:       opts.sources      ?? ['local', 'url'],
      multiple:      opts.multiple     ?? false,
      folder:        opts.folder       ?? 'podversal',
      resource_type: opts.resourceType ?? 'image',
      styles:        { palette: { action: '#E5312A', link: '#E5312A', tabIcon: '#E5312A' } },
    },
    (error: any, result: any) => {
      if (error) { onError?.(); return; }
      if (result?.event === 'success') onSuccess(result.info as CldUploadResult);
    },
  );
}
