import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Search, 
  Check, 
  Copy, 
  Sparkles, 
  FileText, 
  AlertTriangle, 
  Eye, 
  AlignLeft, 
  AlignRight, 
  AlignCenter, 
  Maximize2, 
  Tag, 
  Layers, 
  Plus, 
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { 
  ListCompendiumAssets, 
  SaveAsset, 
  DeleteAsset, 
  GetAssetBase64, 
  FormatAsciidocImage 
} from '../../wailsjs/go/main/App';

export default function MediaGalleryModal({
  isOpen,
  onClose,
  onInsertImage
}) {
  const [gallery, setGallery] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [previewB64, setPreviewB64] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'images', 'attachments', 'orphans'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Layout presets state
  const [layoutPreset, setLayoutPreset] = useState('left'); // 'left', 'right', 'center', 'banner', 'inline'
  const [caption, setCaption] = useState('');
  const [imageWidth, setImageWidth] = useState(250);
  const [copiedCode, setCopiedCode] = useState(false);

  const fileInputRef = useRef(null);

  // Cargar mediateca al abrir
  useEffect(() => {
    if (isOpen) {
      loadGallery();
    } else {
      setSelectedAsset(null);
      setPreviewB64('');
    }
  }, [isOpen]);

  const loadGallery = async () => {
    setIsLoading(true);
    try {
      const res = await ListCompendiumAssets();
      setGallery(res);
      if (res?.assets?.length > 0 && !selectedAsset) {
        handleSelectAsset(res.assets[0]);
      }
    } catch (err) {
      console.error("Error cargando mediateca:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAsset = async (asset) => {
    setSelectedAsset(asset);
    setCaption(asset.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    
    // Cargar previsualización base64 si es imagen
    if (asset.mime_type.startsWith('image/')) {
      try {
        const b64 = await GetAssetBase64(asset.relative_path);
        setPreviewB64(b64);
      } catch (err) {
        console.error("Error cargando preview base64:", err);
        setPreviewB64('');
      }
    } else {
      setPreviewB64('');
    }
  };

  // Subida de archivos manual
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Data = reader.result.split(',')[1];
        const subfolder = file.type.startsWith('image/') ? 'images' : 'attachments';
        const newAsset = await SaveAsset(subfolder, file.name, base64Data);
        await loadGallery();
        if (newAsset) {
          handleSelectAsset(newAsset);
        }
      };
    } catch (err) {
      alert("Error subiendo archivo: " + err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Eliminar activo
  const handleDeleteAsset = async (asset) => {
    if (!confirm(`¿Eliminar definitivamente ${asset.name}?`)) return;
    try {
      await DeleteAsset(asset.relative_path);
      setSelectedAsset(null);
      setPreviewB64('');
      loadGallery();
    } catch (err) {
      alert("Error eliminando activo: " + err);
    }
  };

  // Limpiar todas las imágenes huérfanas
  const handleCleanOrphans = async () => {
    const orphans = gallery?.assets?.filter(a => a.is_orphan) || [];
    if (orphans.length === 0) return;
    if (!confirm(`¿Eliminar ${orphans.length} archivos multimedia que no se usan en ninguna sesión?`)) return;

    for (const orphan of orphans) {
      try {
        await DeleteAsset(orphan.relative_path);
      } catch (e) {
        console.error("Error eliminando huérfana:", e);
      }
    }
    loadGallery();
  };

  // Fragmento AsciiDoc calculado
  const generatedAsciidoc = useMemo(() => {
    if (!selectedAsset) return '';
    return FormatAsciidocImage(selectedAsset.relative_path, caption, layoutPreset, imageWidth);
  }, [selectedAsset, caption, layoutPreset, imageWidth]);

  // Insertar en editor
  const handleInsert = () => {
    if (!selectedAsset || !onInsertImage) return;

    onInsertImage({
      asset: selectedAsset,
      caption,
      layoutPreset,
      imageWidth,
      asciidoc: generatedAsciidoc,
      previewB64
    });
    onClose();
  };

  if (!isOpen) return null;

  // Filtrado de la cuadrícula
  const filteredAssets = (gallery?.assets || []).filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.used_in_sessions.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (categoryFilter === 'images') return a.category === 'images' || a.category === 'diagrams';
    if (categoryFilter === 'attachments') return a.category === 'attachments';
    if (categoryFilter === 'orphans') return a.is_orphan;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl h-[680px] max-h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 select-none">
        
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg text-white">
              <ImageIcon size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold font-outfit text-white flex items-center gap-2">
                Mediateca & Galería de Recursos
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono">
                  {gallery?.total_assets || 0} activos ({gallery?.total_bytes ? formatBytes(gallery.total_bytes) : '0 B'})
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Imágenes, diagramas y adjuntos con maquetación editorial tipo libro
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden" 
              accept="image/*,application/pdf"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
            >
              <Upload size={13} />
              <span>{isUploading ? 'Subiendo...' : 'Subir Archivo'}</span>
            </button>

            {gallery?.orphans_count > 0 && (
              <button
                onClick={handleCleanOrphans}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors"
                title="Eliminar archivos que no se usan en ninguna sesión"
              >
                <Trash2 size={13} />
                <span>Limpiar ({gallery.orphans_count})</span>
              </button>
            )}

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="px-6 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                categoryFilter === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({gallery?.total_assets || 0})
            </button>

            <button
              onClick={() => setCategoryFilter('images')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                categoryFilter === 'images' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🖼️ Imágenes ({gallery?.images_count || 0})
            </button>

            <button
              onClick={() => setCategoryFilter('attachments')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                categoryFilter === 'attachments' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📄 Documentos ({gallery?.docs_count || 0})
            </button>

            <button
              onClick={() => setCategoryFilter('orphans')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                categoryFilter === 'orphans' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚠️ Sin uso ({gallery?.orphans_count || 0})
            </button>
          </div>

          <div className="relative w-64">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o sesión..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Main Body: Cuadrícula Izquierda + Inspector Derecho */}
        <div className="flex-1 w-full flex divide-x divide-slate-800 overflow-hidden">
          
          {/* Panel Izquierdo: Cuadrícula de Activos */}
          <div className="flex-1 p-4 overflow-y-auto">
            {filteredAssets.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  const isImg = asset.mime_type.startsWith('image/');

                  return (
                    <div
                      key={asset.id}
                      onClick={() => handleSelectAsset(asset)}
                      className={`group relative rounded-xl border p-2.5 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/50' 
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      {/* Miniatura o Icono */}
                      <div className="w-full h-24 rounded-lg bg-slate-900 flex items-center justify-center overflow-hidden mb-2 relative">
                        {isImg ? (
                          <div className="w-full h-full flex items-center justify-center p-1">
                            <img 
                              src={`data:${asset.mime_type};base64,${previewB64 && isSelected ? previewB64 : ''}`}
                              alt={asset.name}
                              className="max-h-full max-w-full object-contain rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            {(!previewB64 || !isSelected) && (
                              <ImageIcon size={28} className="text-slate-600" />
                            )}
                          </div>
                        ) : (
                          <FileText size={32} className="text-indigo-400" />
                        )}

                        {asset.is_orphan && (
                          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-500/40 text-[9px] font-mono font-semibold">
                            Huérfana
                          </span>
                        )}
                      </div>

                      {/* Info del Activo */}
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-200 truncate" title={asset.name}>
                          {asset.name}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>{asset.size_formatted}</span>
                          <span>
                            {asset.used_in_sessions.length > 0 
                              ? `En ${asset.used_in_sessions.length} lecc.` 
                              : '0 usos'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                <ImageIcon size={40} className="mb-2 opacity-40 text-slate-600" />
                <p className="text-xs">No se encontraron archivos en la mediateca.</p>
                <p className="text-[10px] text-slate-600 mt-1">Arrastra imágenes al editor o pulsa "Subir Archivo".</p>
              </div>
            )}
          </div>

          {/* Panel Derecho: Inspector y Selector de Maquetación Editorial */}
          {selectedAsset ? (
            <div className="w-80 h-full p-4 bg-slate-950/70 overflow-y-auto flex flex-col justify-between shrink-0 space-y-4">
              
              <div className="space-y-4">
                {/* Vista Previa Grande */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Vista Previa:</span>
                  <div className="w-full h-36 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden p-2">
                    {selectedAsset.mime_type.startsWith('image/') && previewB64 ? (
                      <img 
                        src={`data:${selectedAsset.mime_type};base64,${previewB64}`} 
                        alt={selectedAsset.name} 
                        className="max-h-full max-w-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="text-center space-y-1">
                        <FileText size={36} className="mx-auto text-indigo-400" />
                        <span className="text-[10px] font-mono text-slate-400 block">{selectedAsset.mime_type}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trazabilidad: Dónde se usa */}
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Uso en el Compendio:</span>
                  {selectedAsset.used_in_sessions.length > 0 ? (
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {selectedAsset.used_in_sessions.map((sRel) => (
                        <div key={sRel} className="text-[11px] text-emerald-300 font-mono truncate">
                          • {sRel.split('/').pop()}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-400 italic">⚠️ No se utiliza en ningún documento .adoc.</p>
                  )}
                </div>

                {/* Presets de Maquetación Editorial (Book Layout) */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <BookOpen size={13} />
                    <span>Maquetación Editorial (AsciiDoc):</span>
                  </span>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setLayoutPreset('left')}
                      className={`p-2 rounded-lg border text-left text-xs transition-all ${
                        layoutPreset === 'left' 
                          ? 'bg-indigo-600/30 border-indigo-500 text-white font-semibold' 
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                      title="Flotando a la izquierda con texto envolvente (diseño clásico de libro)"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <AlignLeft size={13} className="text-sky-400" />
                        <span className="font-semibold text-[11px]">Flotante Izq.</span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-tight">Texto envolvente</p>
                    </button>

                    <button
                      onClick={() => setLayoutPreset('right')}
                      className={`p-2 rounded-lg border text-left text-xs transition-all ${
                        layoutPreset === 'right' 
                          ? 'bg-indigo-600/30 border-indigo-500 text-white font-semibold' 
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                      title="Flotando a la derecha con texto envolvente"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <AlignRight size={13} className="text-sky-400" />
                        <span className="font-semibold text-[11px]">Flotante Der.</span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-tight">Texto envolvente</p>
                    </button>

                    <button
                      onClick={() => setLayoutPreset('center')}
                      className={`p-2 rounded-lg border text-left text-xs transition-all ${
                        layoutPreset === 'center' 
                          ? 'bg-indigo-600/30 border-indigo-500 text-white font-semibold' 
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                      title="Figura centrada con pie de foto formal numerado"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <AlignCenter size={13} className="text-amber-400" />
                        <span className="font-semibold text-[11px]">Figura Central</span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-tight">Pie y numeración</p>
                    </button>

                    <button
                      onClick={() => setLayoutPreset('banner')}
                      className={`p-2 rounded-lg border text-left text-xs transition-all ${
                        layoutPreset === 'banner' 
                          ? 'bg-indigo-600/30 border-indigo-500 text-white font-semibold' 
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                      title="Banner a 100% de ancho para portadas de sesión"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Maximize2 size={13} className="text-emerald-400" />
                        <span className="font-semibold text-[11px]">Banner 100%</span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-tight">Ancho completo</p>
                    </button>
                  </div>
                </div>

                {/* Parámetros: Pie de foto y Ancho */}
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Pie de Foto / Título:</label>
                    <input
                      type="text"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {layoutPreset !== 'banner' && (
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span>Ancho en Página:</span>
                        <span className="font-mono">{imageWidth} px</span>
                      </div>
                      <input
                        type="range"
                        min={120}
                        max={650}
                        step={10}
                        value={imageWidth}
                        onChange={(e) => setImageWidth(Number(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de Acción Final */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                {onInsertImage && (
                  <button
                    onClick={handleInsert}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
                  >
                    <Plus size={14} />
                    <span>Insertar en el Editor</span>
                  </button>
                )}

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedAsciidoc);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedCode ? 'Código Copiado' : 'Copiar AsciiDoc'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteAsset(selectedAsset)}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    title="Eliminar archivo del compendio"
                  >
                    <Trash2 size={12} />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="w-80 h-full p-6 bg-slate-950/40 flex flex-col items-center justify-center text-center text-slate-500 text-xs shrink-0">
              <Eye size={28} className="mb-2 opacity-30 text-slate-500" />
              <p>Selecciona un archivo para ver detalles y opciones de maquetación.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

function formatBytes(b) {
  const unit = 1024;
  if (b < unit) return `${b} B`;
  const exp = Math.floor(Math.log(b) / Math.log(unit));
  const pre = "KMGTPE"[exp - 1];
  return `${(b / Math.pow(unit, exp)).toFixed(1)} ${pre}B`;
}
