import { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import type { Annotation } from '@/types';
import {
  MousePointer2,
  Square,
  Circle,
  Pencil,
  ArrowRight,
  Type,
  Eraser,
  Undo2,
  Redo2,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  ImageIcon,
  MapPin,
  StickyNote,
  FolderTree,
} from 'lucide-react';

const anatomyGroups = [
  {
    name: '食管',
    icon: '🔴',
    children: ['上段', '中段', '下段', '贲门'],
  },
  {
    name: '胃',
    icon: '🟠',
    children: ['胃底', '胃体', '胃角', '胃窦', '幽门'],
  },
  {
    name: '十二指肠',
    icon: '🟡',
    children: ['球部', '降部'],
  },
  {
    name: '结直肠',
    icon: '🟢',
    children: ['直肠', '乙状', '降结肠', '横结肠', '升结肠', '盲肠'],
  },
];

const annotationColors = [
  '#F53F3F',
  '#F77234',
  '#FF7D00',
  '#00B42A',
  '#165DFF',
  '#722ED1',
];

const toolButtons = [
  { id: 'select', icon: MousePointer2, label: '选择' },
  { id: 'rect', icon: Square, label: '矩形' },
  { id: 'circle', icon: Circle, label: '圆形' },
  { id: 'freehand', icon: Pencil, label: '自由曲线' },
  { id: 'arrow', icon: ArrowRight, label: '箭头' },
  { id: 'text', icon: Type, label: '文字' },
  { id: 'eraser', icon: Eraser, label: '橡皮擦' },
];

const annotationTypeMap: Record<Annotation['type'], { label: string; icon: typeof Square }> = {
  rect: { label: '矩形', icon: Square },
  circle: { label: '圆形', icon: Circle },
  freehand: { label: '画笔', icon: Pencil },
  arrow: { label: '箭头', icon: ArrowRight },
  text: { label: '文字', icon: Type },
};

export default function ImageAnnotation() {
  const {
    getExamImages,
    selectedImageId,
    setSelectedImage,
    currentTool,
    setCurrentTool,
    currentAnnotationColor,
    setAnnotationColor,
    removeAnnotation,
    getImageAnnotations,
  } = useAppStore();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    食管: true,
    胃: true,
    十二指肠: true,
    结直肠: true,
  });
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);

  const allImages = getExamImages();
  const selectedImage = allImages.find((img) => img.id === selectedImageId);

  const getLocationImageCount = useMemo(() => {
    const countMap: Record<string, number> = {};
    allImages.forEach((img) => {
      for (const group of anatomyGroups) {
        for (const child of group.children) {
          if (img.location.includes(child) || img.location.includes(group.name)) {
            const key = `${group.name}-${child}`;
            countMap[key] = (countMap[key] || 0) + 1;
            countMap[group.name] = (countMap[group.name] || 0) + 1;
          }
        }
      }
    });
    return countMap;
  }, [allImages]);

  const filteredImages = useMemo(() => {
    if (!selectedLocation) return allImages;
    return allImages.filter(
      (img) => img.location.includes(selectedLocation) || selectedLocation.includes(img.location.split(/[（(]/)[0]),
    );
  }, [allImages, selectedLocation]);

  const currentAnnotations = selectedImage ? getImageAnnotations(selectedImage.id) : [];

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const handleLocationClick = (location: string | null) => {
    setSelectedLocation(location);
    if (location && filteredImages.length > 0) {
      setSelectedImage(filteredImages[0].id);
    }
  };

  return (
    <div className="h-screen w-screen flex bg-slate-100 overflow-hidden">
      {/* 左栏 - 部位树导航 */}
      <aside className="w-[200px] shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <FolderTree className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-800">解剖部位</span>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <button
            onClick={() => handleLocationClick(null)}
            className={`w-full flex items-center gap-2 px-4 py-2 mx-2 mr-2 rounded-lg text-left text-sm transition-colors ${
              selectedLocation === null
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1 truncate">全部图片</span>
            <span className="text-[11px] text-slate-400">{allImages.length}</span>
          </button>

          {anatomyGroups.map((group) => (
            <div key={group.name} className="mt-1">
              <button
                onClick={() => toggleGroup(group.name)}
                className={`w-full flex items-center gap-1.5 px-4 py-2 mx-2 mr-2 rounded-lg text-left text-sm transition-colors ${
                  selectedLocation === group.name
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {expandedGroups[group.name] ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className="text-xs">{group.icon}</span>
                <span className="flex-1 truncate font-medium">{group.name}</span>
                <span className="text-[11px] text-slate-400">
                  {getLocationImageCount[group.name] || 0}
                </span>
              </button>

              {expandedGroups[group.name] && (
                <div className="ml-4 mt-0.5 space-y-0.5">
                  {group.children.map((child) => {
                    const key = `${group.name}-${child}`;
                    const count = getLocationImageCount[key] || 0;
                    const isActive = selectedLocation === child;
                    return (
                      <button
                        key={child}
                        onClick={() => count > 0 && handleLocationClick(child)}
                        disabled={count === 0}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 mx-2 mr-2 rounded-md text-left text-xs transition-colors ${
                          count === 0
                            ? 'text-slate-300 cursor-not-allowed'
                            : isActive
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            count > 0 ? (isActive ? 'bg-blue-500' : 'bg-slate-300') : 'bg-slate-200'
                          }`}
                        />
                        <span className="flex-1 truncate">{child}</span>
                        <span className="text-[10px] text-slate-400">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <div className="text-[11px] text-slate-400 mb-1">当前筛选</div>
          <div className="text-sm font-medium text-slate-700 truncate">
            {selectedLocation || '全部部位'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            共 {filteredImages.length} 张图片
          </div>
        </div>
      </aside>

      {/* 中栏 - 画布操作区 */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* 顶部悬浮工具栏 */}
        <div className="relative px-4 pt-3">
          <div className="bg-white rounded-xl shadow-lg shadow-slate-200/60 border border-slate-200 px-3 py-2 flex items-center gap-1">
            {toolButtons.map((tool) => {
              const Icon = tool.icon;
              const isActive = currentTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setCurrentTool(tool.id)}
                  title={tool.label}
                  className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/30'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}

            <div className="w-px h-5 bg-slate-200 mx-2" />

            <div className="flex items-center gap-1.5 px-1">
              {annotationColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setAnnotationColor(color)}
                  title={`颜色 ${color}`}
                  className={`w-6 h-6 rounded-lg transition-all ${
                    currentAnnotationColor === color
                      ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="w-px h-5 bg-slate-200 mx-2" />

            <button
              title="撤销"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              title="重做"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            <div className="ml-auto flex items-center gap-3 px-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3.5 h-3.5 rounded-md border-2 border-white shadow-sm"
                  style={{ backgroundColor: currentAnnotationColor }}
                />
                <span className="text-xs text-slate-500">
                  {toolButtons.find((t) => t.id === currentTool)?.label || '选择工具'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 主图显示区 */}
        <div className="flex-1 p-4 min-h-0">
          <div className="h-full w-full bg-white rounded-xl border-2 border-slate-200 border-dashed flex items-center justify-center overflow-hidden relative">
            {selectedImage ? (
              <div className="relative w-full h-full flex items-center justify-center p-8">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.description}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-xl shadow-slate-200"
                />
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-slate-200 shadow-sm">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs font-medium text-slate-700">{selectedImage.location}</span>
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500">{selectedImage.capturedAt}</span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-slate-200 shadow-sm">
                  <div className="flex items-start gap-2">
                    <StickyNote className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-700 truncate">
                        {selectedImage.description}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        标注 {selectedImage.annotations.length} 条 · {selectedImage.id}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <ImageIcon className="w-9 h-9 text-slate-400" />
                </div>
                <div className="text-base font-semibold text-slate-600 mb-1">暂无图片</div>
                <div className="text-sm text-slate-400">请从左侧选择部位或检查</div>
              </div>
            )}
          </div>
        </div>

        {/* 底部缩略图栏 */}
        <div className="px-4 pb-4">
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-xs font-semibold text-slate-600">图片列表</span>
              <span className="text-[11px] text-slate-400">
                {filteredImages.length} 张
              </span>
              <div className="flex-1" />
              <span className="text-[11px] text-slate-400">
                第 {filteredImages.findIndex((i) => i.id === selectedImageId) + 1 || '-'} /{' '}
                {filteredImages.length}
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {filteredImages.map((img, idx) => {
                const isActive = img.id === selectedImageId;
                return (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.id)}
                    className={`shrink-0 group relative rounded-lg overflow-hidden transition-all ${
                      isActive
                        ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg shadow-blue-500/20'
                        : 'ring-1 ring-slate-200 hover:ring-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div className="w-[110px] h-[80px] bg-slate-50 flex items-center justify-center">
                      <img
                        src={img.url}
                        alt={img.location}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] rounded px-1.5 py-0.5">
                      {idx + 1}
                    </div>
                    {img.annotations.length > 0 && (
                      <div className="absolute top-1 right-1 bg-blue-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-medium">
                        {img.annotations.length}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                      <div className="text-[10px] text-white truncate font-medium">
                        {img.location}
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredImages.length === 0 && (
                <div className="flex-1 text-center py-6 text-sm text-slate-400">
                  该部位暂无图片
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 右栏 - 标注列表面板 */}
      <aside className="w-[280px] shrink-0 bg-white border-l border-slate-200 flex flex-col">
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <Edit2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-800">
            标注列表（{currentAnnotations.length}条）
          </span>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {currentAnnotations.length > 0 ? (
            <div className="space-y-2 px-3">
              {currentAnnotations.map((annotation, index) => {
                const typeInfo = annotationTypeMap[annotation.type];
                const Icon = typeInfo.icon;
                const isHovered = hoveredAnnotation === annotation.id;
                return (
                  <div
                    key={annotation.id}
                    onMouseEnter={() => setHoveredAnnotation(annotation.id)}
                    onMouseLeave={() => setHoveredAnnotation(null)}
                    className="group relative bg-white rounded-xl border border-slate-200 p-3 hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white shadow-sm"
                        style={{ backgroundColor: annotation.color }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-700">
                            {typeInfo.label} #{index + 1}
                          </span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${annotation.color}15`,
                              color: annotation.color,
                            }}
                          >
                            标注
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-1 mb-1.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{selectedImage?.location}</span>
                        </div>
                        {annotation.note && (
                          <div className="text-[11px] text-slate-500 bg-slate-50 rounded-md px-2 py-1.5 leading-relaxed">
                            {annotation.note}
                          </div>
                        )}
                      </div>

                      {isHovered && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-white rounded-lg shadow-md border border-slate-200 p-0.5">
                          <button
                            className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="编辑"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              selectedImageId && removeAnnotation(selectedImageId, annotation.id)
                            }
                            className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-16 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Edit2 className="w-7 h-7 text-slate-300" />
              </div>
              <div className="text-sm font-medium text-slate-500 mb-1">暂无标注</div>
              <div className="text-xs text-slate-400 leading-relaxed">
                {selectedImage
                  ? '使用工具栏中的标注工具在图片上绘制'
                  : '请先选择一张图片'}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          {selectedImage && (
            <>
              <div className="text-[11px] text-slate-400 mb-1">当前图片</div>
              <div className="text-sm font-medium text-slate-700 truncate mb-1">
                {selectedImage.location}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">{selectedImage.id}</span>
                <span className="text-[11px] text-blue-600 font-medium">
                  {currentAnnotations.length} 条标注
                </span>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
