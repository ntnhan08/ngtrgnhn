# EYECORE LABS — Cấu trúc dự án

Tài liệu này mô tả **toàn bộ cây thư mục**, vai trò của từng file, kiến trúc phân tầng và các
luồng dữ liệu chính. Đọc xong file này bạn sẽ biết chính xác cần mở file nào để sửa bất kỳ
thứ gì trong ứng dụng.

## 1. Kiến trúc phân tầng

```
┌──────────────────────────────────────────────────────────────────┐
│  Trình duyệt                                                     │
│  ├── index.html (intro CSS thuần, vẽ trước cả khi JS chạy)        │
│  └── sw.js (service worker — cache-first, offline 100%)           │
├──────────────────────────────────────────────────────────────────┤
│  Presentation   React + Tailwind v4 + Framer Motion               │
│  Animation      Framer Motion (dissolve, spring, stagger)         │
├──────────────────────────────────────────────────────────────────┤
│  State          Zustand (4 store)                                 │
│  ├── appStore      boot, config, seed dữ liệu mẫu                 │
│  ├── contactsStore CRUD liên hệ ←→ Dexie                          │
│  ├── settingsStore theme/layout/animation/privacy ←→ Dexie        │
│  └── uiStore       điều hướng, overlay, toast, confirm, burst     │
├──────────────────────────────────────────────────────────────────┤
│  Data           Dexie.js trên IndexedDB (`eyecore-labs-db`)       │
│  ├── contacts · images · settings                                 │
├──────────────────────────────────────────────────────────────────┤
│  Configuration  public/config/config.json (người dùng tự sửa)     │
└──────────────────────────────────────────────────────────────────┘
```

**Nguyên tắc vàng:** `config.json` là *nguồn cấu hình mặc định* (chỉ đọc, không bao giờ ghi);
IndexedDB là *nguồn dữ liệu runtime* (mọi thao tác thêm/sửa/xóa liên hệ đều ghi vào đây).

## 2. Sơ đồ cây

```
EYECORE-LABS/
├── index.html                 # Shell + intro con mắt (CSS thuần, ngoài #root)
├── vercel.json                # Cấu hình deploy Vercel (cache sw.js/config.json)
├── package.json               # deps: react, zustand, dexie, jszip, framer-motion,
│                              #       lucide-react, @fontsource-variable/*
├── vite.config.js             # Vite + @tailwindcss/vite + @vitejs/plugin-react
├── tsconfig.json
│
├── public/                    # File tĩnh — được copy nguyên vào dist/
│   ├── config/
│   │   ├── config.json        # ★ NGƯỜI DÙNG SỬA — hồ sơ chủ sở hữu + hiển thị
│   │   └── config.example.json# Bản mẫu sạch để sao chép
│   ├── icons/icon.svg         # Icon mắt cười (PWA + favicon)
│   ├── manifest.webmanifest   # PWA manifest (standalone, theme #cfe7f5)
│   └── sw.js                  # Service worker: cache-first, config network-first
│
├── src/
│   ├── main.tsx               # Mount React, import font local, đăng ký SW (PROD)
│   ├── vite-env.d.ts          # Kiểu Vite + window.__pvIntroStart
│   ├── index.css              # Design system "nature school" (tokens, keyframes,
│   │                          #   btn-comic, glass, ink-pop, profile-halo, freeze-scene…)
│   ├── App.tsx                # Điều phối: canh giờ intro, code-split, dissolve,
│   │                          #   màn hình lỗi config/boot, prefetch chunk
│   ├── types.ts               # Toàn bộ interface/union type dùng chung
│   │
│   ├── utils/
│   │   ├── format.ts          # cn, uid, normalizeText (bỏ dấu), mask phone/email/
│   │   │                      #   bank, timeAgo, RELATIONSHIP_META, VN_BANKS,
│   │   │                      #   avatarPalette
│   │   └── search.ts          # matchContact, applyFilters, countActiveFilters,
│   │                          #   sortContacts (7 kiểu), SORT_OPTIONS
│   │
│   ├── services/
│   │   ├── db.ts              # Dexie schema v1: contacts / images / settings
│   │   ├── configService.ts   # loadConfig (fetch + validate + deepMerge),
│   │   │                      #   validateConfig, ownerFromConfig, OWNER_ID
│   │   ├── images.ts          # File→canvas→WebP ≤512px → Blob → IndexedDB,
│   │   │                      #   cache object URL, prune ảnh mồ côi
│   │   └── backup.ts          # buildBackupZip / parseBackupZip (JSZip),
│   │                          #   normalizeContact, downloadBlob
│   │
│   ├── store/
│   │   ├── appStore.ts        # init(): config → settings → contacts → seed 8 mẫu
│   │   ├── contactsStore.ts   # add / update / remove / mergeAll / clearAll
│   │   ├── settingsStore.ts   # load + setTheme/setLayout/setAnimation/setPrivacy
│   │   ├── uiStore.ts         # view, profileId, formOpen, confirm, toasts, burst
│   │   └── uiStoreTypes.ts    # ConfirmState, BurstState
│   │
│   ├── components/
│   │   ├── AppShell.tsx       # ★ BẦU TRỜI SỐNG: mặt trời, cầu vồng, mây, chim,
│   │   │                      #   máy bay giấy, khinh khí cầu, diều, bướm, ong,
│   │   │                      #   sên, cây táo, nấm, hoa, lá rơi, sao + parallax
│   │   ├── Fx.tsx             # CursorGlow, ConfettiBurst, CountUp, Magnetic
│   │   ├── Avatar.tsx         # Sticker vuông viền mực; fallback monogram
│   │   ├── BankInfo.tsx       # Che •••• •••• 6789 + Show/Copy ("Copied!")
│   │   ├── BrandIcons.tsx     # 12 mạng xã hội — SVG nội bộ, chỉ icon, tooltip
│   │   ├── ContactCard.tsx    # Thẻ lưới (tilt 3D) + hàng danh sách, ink-pop
│   │   ├── ContactForm.tsx    # Modal thêm/sửa: ảnh, validation, saved-check,
│   │   │                      #   confetti khi thêm mới
│   │   ├── ProfileView.tsx    # Overlay full view: blur 14px + freeze nền,
│   │   │                      #   panel góc tag, thanh tiến độ đọc
│   │   ├── Toolbar.tsx        # SearchBar, FilterPanel, SortMenu, LayoutToggle
│   │   ├── Toasts.tsx         # Phản hồi save/delete/import/copy
│   │   └── ui/Primitives.tsx  # Tip, Toggle, Segmented, Modal (vuốt-để-đóng),
│   │                          #   ConfirmBody, EmptyState, Sensitive,
│   │                          #   RelationshipBadge
│   │
│   └── pages/
│       ├── Home.tsx           # Hồ sơ chủ sở hữu nổi trên trời (halo + ink-pop)
│       ├── Contacts.tsx       # Thư mục: tìm/lọc/sort/grid-list/pagination
│       └── Settings.tsx       # Giao diện, motion, privacy, backup/import/clear,
│                              #   thống kê lưu trữ (CountUp)
│
├── README.md                  # Hướng dẫn tổng quan + quick start
├── CONFIGURATION.md           # Tham chiếu từng field của config.json
└── STRUCTURE.md               # File này
```

## 3. Vai trò từng file (chi tiết)

### Gốc dự án
- **`index.html`** — Quan trọng nhất cho trải nghiệm "vào web": chứa intro con mắt viết bằng
  CSS thuần (blink 3 lần → lật vào chữ O → chữ hiện → gạch chân → giữ 2s). Nằm **ngoài
  `#root`** nên React mount không bao giờ ngắt nó. Đặt `window.__pvIntroStart` để React canh
  đúng thời điểm dissolve (6.95s).
- **`vercel.json`** — rewrite SPA về `index.html`; `sw.js` và `config/config.json` luôn
  `max-age=0, must-revalidate` để bản cập nhật PWA và cấu hình không bị cache cũ chặn.
- **`src/index.css`** — Toàn bộ ngôn ngữ thiết kế: token màu (trời xanh, mực thông, vàng nắng,
  lá xanh), class dùng lại (`btn-comic`, `glass`, `chip-square`, `ink-pop`, `profile-halo`,
  `marker`, `shine`), keyframes cho ~20 sinh vật nền, `freeze-scene` (đóng băng nền khi mở
  overlay), giảm chuyển động (`prefers-reduced-motion`, `.anim-off`).

### Tầng dữ liệu & dịch vụ
- **`services/db.ts`** — Định nghĩa bảng Dexie. Đổi schema phải bump `version()`.
- **`services/configService.ts`** — Đọc `config.json`, kiểm tra kiểu từng field, merge an toàn
  lên `DEFAULT_CONFIG`, sinh `ConfigIssue` nếu sai. `ownerFromConfig` biến profile thành
  ContactRecord chỉ-đọc (id `owner`).
- **`services/images.ts`** — Nén ảnh người dùng chọn (canvas → WebP ≤512px), lưu Blob, cấp và
  thu hồi object URL, dọn ảnh không còn ai dùng.
- **`services/backup.ts`** — Đóng/mở ZIP backup. Import luôn *merge* (không xóa dữ liệu cũ),
  validate JSON + ảnh trước khi ghi.

### Tầng state
- **`store/appStore.ts`** — Khởi động một lần: config → settings → contacts → seed 8 liên hệ
  mẫu (lần chạy đầu). Nắm `ready`, `issues`, `bootError`.
- **`store/contactsStore.ts`** — Mọi mutation ghi thẳng Dexie rồi cập nhật state đồng bộ.
- **`store/settingsStore.ts`** — Bền vững hóa theme/layout/animation/privacy; áp class lên
  `<html>/<body>` ngay khi đổi.
- **`store/uiStore.ts`** — Điều hướng 3 view, mở/đóng profile & form, hàng đợi toast, hộp thoại
  xác nhận (Promise), và bắn confetti.

### Giao diện
- **`components/AppShell.tsx`** — "Nhân vật chính" của phần nhìn: ~25 SVG hoạt hình tạo nên
  bầu trời trường học thiên nhiên, parallax theo chuột (rAF-gated), tự tắt trên mobile yếu tố
  nặng (`fx-extra`).
- **`components/ProfileView.tsx`** — Khi mở: thêm `freeze-scene` vào body để lớp blur chỉ xử lý
  một khung hình tĩnh → cuộn mượt 60fps. Panel hiện dần khi cuộn tới (`whileInView`).
- **`components/ContactForm.tsx`** — Form đầy đủ 15+ trường, 12 toggle mạng xã hội, chọn/xóa
  ảnh, nút Save có hiệu ứng check vẽ pathLength, confetti lá + sao khi thêm thành công.

## 4. Các luồng dữ liệu tiêu biểu

### Khởi động
```
index.html vẽ intro (CSS) ──► main.tsx mount App ──► appStore.init():
  loadConfig() → settingsStore.load() → contactsStore.load() → seed mẫu
React canh __pvIntroStart + 6.95s → thêm .si-exit → gỡ #static-intro → mở băng nền
```

### Thêm liên hệ
```
ContactForm → processImageFile() (WebP) → storeImage() (IndexedDB)
            → contactsStore.add() → Dexie.put → state cập nhật → toast + confetti
```

### Sao lưu / khôi phục
```
Export: db.contacts + db.images + settings → JSZip → downloadBlob()
Import: parseBackupZip() (validate) → askConfirm() → mergeAll() + bulkPut(images)
```

## 5. Quy ước cần nhớ

1. **Offline 100%** — không import CDN, không fetch ngoài origin; font & icon đều đóng gói.
2. **60fps** — chỉ animate `transform`/`opacity`; hiệu ứng nền chạy CSS; pointer effect qua
   `requestAnimationFrame`; overlay dùng `freeze-scene`.
3. **Hiển thị có điều kiện** — field bị tắt trong `visibility` không render DOM (không dùng
   `visibility:hidden`).
4. **Tìm kiếm không phân biệt dấu** — luôn qua `normalizeText()` (hỗ trợ tiếng Việt).
5. **Tách code theo trang** — Contacts/ProfileView/ContactForm/Settings là `lazy()`, prefetch
   trong lúc intro chạy.
