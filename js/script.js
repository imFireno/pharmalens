// Landing Page
const hamburger = document.querySelector(".hamburger");
const menu = document.querySelector(".menu");

hamburger.addEventListener("click", () => {
    hamburger.classList.toggle('is-active');

    menu.classList.toggle("menu-active");
});

window.addEventListener("scroll", () => {
    hamburger.classList.remove("is-active");
    menu.classList.remove("menu-active");
})

// Scan Obat
  const uploadInput = document.getElementById("upload");
  const previewImg = document.getElementById("preview");
  const explanation = document.getElementById("aiExplanation");
  const uploadForm = document.getElementById("uploadForm");
  const manualSearchContainer = document.getElementById("manualSearchContainer");
  const manualSearchInput = document.getElementById("manualSearch");
  const searchButton = document.getElementById("searchButton");

  // Reset manual search dan hasil saat gambar dipilih
  uploadInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      previewImg.src = URL.createObjectURL(file);
      previewImg.classList.remove("hidden");
      explanation.textContent = "Silakan klik Scan untuk memproses gambar.";
    }

    // 🔁 Reset manual search
    manualSearchInput.value = "";
    manualSearchContainer.classList.add("hidden");
  });

  // Submit form untuk scan gambar
  uploadForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const file = uploadInput.files[0];
    if (!file) return;

    // Check if user is logged in
    const token = localStorage.getItem('pharmalens_token');
    if (!token) {
      explanation.textContent = "Silakan login terlebih dahulu untuk menggunakan fitur scan.";
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }

    explanation.textContent = "Memproses gambar dengan OCR dan AI...";
    manualSearchContainer.classList.add("hidden");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Scan failed');
      }

      if (result.success) {
        // Display AI analysis result
        explanation.innerHTML = `
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">Teks yang Terdeteksi (OCR):</h4>
              <p class="text-sm text-blue-700">${result.ocrResult || 'Tidak ada teks yang terdeteksi'}</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">Analisis AI:</h4>
              <div class="text-sm text-green-700 whitespace-pre-wrap">${result.aiAnalysis}</div>
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-500">Hasil scan telah disimpan ke riwayat Anda</p>
              <a href="/" class="inline-block mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                Lihat Riwayat Scan
              </a>
            </div>
          </div>
        `;
      } else {
        explanation.textContent = "Gambar tidak dapat diproses. Silakan coba lagi atau gunakan pencarian manual.";
        manualSearchContainer.classList.remove("hidden");
      }
    } catch (error) {
      console.error('Scan error:', error);
      
      if (error.message.includes('token') || error.message.includes('auth')) {
        explanation.textContent = "Sesi Anda telah berakhir. Silakan login kembali.";
        setTimeout(() => {
          localStorage.removeItem('pharmalens_token');
          localStorage.removeItem('pharmalens_user');
          window.location.href = '/login';
        }, 2000);
      } else {
        explanation.textContent = `Terjadi kesalahan: ${error.message}. Silakan coba lagi.`;
        manualSearchContainer.classList.remove("hidden");
      }
    }
  });

  // Pencarian manual
  searchButton.addEventListener("click", function () {
    const keyword = manualSearchInput.value.trim();
    if (!keyword) return;

    // 🔁 Reset upload gambar
    uploadInput.value = "";
    previewImg.src = "";
    previewImg.classList.add("hidden");

    // Simulasi database
    const dummyDatabase = {
      "paracetamol": "Paracetamol adalah obat untuk menurunkan demam dan meredakan nyeri.",
      "amoxicillin": "Amoxicillin adalah antibiotik untuk mengobati infeksi bakteri.",
      "ibuprofen": "Ibuprofen digunakan untuk mengurangi peradangan dan nyeri."
    };

    const result = dummyDatabase[keyword.toLowerCase()];
    explanation.textContent = result || "Obat tidak ditemukan dalam database.";
  });
