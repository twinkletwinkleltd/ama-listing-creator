export default function ImageGuidePage() {
  const images = [
    { n: 1, slot: 'Main Image URL',  desc: '白底正面图（必须）', tip: '白底，产品居中，占画面85%以上，无文字水印' },
    { n: 2, slot: 'Image URL 2',     desc: '白底侧面图',        tip: '同样白底，展示镜架侧面厚度和腿部弯折' },
    { n: 3, slot: 'Image URL 3',     desc: '白底45度图',        tip: '斜45度拍摄，展示镜框立体感' },
    { n: 4, slot: 'Image URL 4',     desc: '尺寸标注图',        tip: '在Canva或PS上添加镜框尺寸标注（51mm×30mm等）' },
    { n: 5, slot: 'Image URL 5',     desc: '细节放大图',        tip: '放大弹簧铰链、镜腿材质、防滑鼻托等细节' },
    { n: 6, slot: 'Image URL 6',     desc: '书桌场景图',        tip: '放置在书桌/沙发旁的生活场景，可用AI生成' },
    { n: 7, slot: 'Image URL 7',     desc: '多色展示图',        tip: '将多个颜色拼在一张图上，展示全系列' },
  ]

  return (
    <div className="flex-1 bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">📷 Amazon 图片指南</h1>
          <p className="text-sm text-gray-500 mt-1">Reading Glasses 产品图片拍摄与制作规范</p>
        </div>

        {/* 基本要求 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-700">基本拍摄要求</h2>
          <ul className="flex flex-col gap-2">
            {[
              '背景：纯白色（#FFFFFF），不允许有阴影或渐变',
              '尺寸：最小 1000×1000px，推荐 2000×2000px',
              '格式：JPEG 或 PNG，文件大小不超过 10MB',
              '产品占比：产品需占据画面至少 85%',
              '禁止：水印、文字、边框、促销标识、多件产品（主图）',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* 7张图分配 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-700">7张图位分配</h2>
          <div className="flex flex-col gap-2">
            {images.map((img) => (
              <div key={img.n} className="flex gap-3 items-start p-3 rounded-xl border border-gray-100 bg-gray-50">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {img.n}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-gray-800">{img.desc}</span>
                    <span className="text-xs text-gray-400 font-mono truncate">→ {img.slot}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{img.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI 生图提示词 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-700">ChatGPT / Midjourney 生图提示词</h2>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">书桌场景版（图6）</p>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 font-mono text-xs text-gray-700 leading-relaxed select-all">
              {`Product photography of black reading glasses placed on a wooden desk next to an open book and a cup of coffee, warm natural light from left, shallow depth of field, clean minimal background, lifestyle product shot, 4K`}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">模特佩戴版（可选）</p>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 font-mono text-xs text-gray-700 leading-relaxed select-all">
              {`Middle-aged woman wearing black reading glasses while reading a book, natural indoor lighting, warm and cozy atmosphere, lifestyle photography, white background, professional product photography`}
            </div>
          </div>
        </div>

        {/* 托管建议 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-1">
          <p className="text-xs font-semibold text-amber-700">💡 图片托管建议</p>
          <p className="text-xs text-amber-600 leading-relaxed">
            将拍好的图片上传到网站（如 twinkletwinkle.uk/wp-content/uploads/），复制图片直链URL填入编辑器即可。
            确保URL以 .jpg / .png / .jpeg 结尾，且可在浏览器直接访问。
          </p>
        </div>
      </div>
    </div>
  )
}
