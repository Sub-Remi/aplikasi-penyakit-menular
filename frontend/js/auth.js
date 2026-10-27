async function checkAuth() {
    try {
        const response = await fetch("http://localhost:3000/api/auth/me", {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            window.location.replace("../login/login.html");
            return;
        }

        const data = await response.json();
        const userRole = data.user.role; // 'admin' atau 'validator'
        const currentPath = window.location.pathname;

        // Cek apakah user berada di halaman yang salah
        if (currentPath.includes('/admin/') && userRole !== 'admin') {
            // Jika bukan admin tapi mencoba akses folder admin
            window.location.replace("../login/login.html"); 
        } else if (currentPath.includes('/validator/') && userRole !== 'validator') {
            // Jika bukan validator tapi mencoba akses folder validator
            window.location.replace("../login/login.html"); 
        }

    } catch (error) {
        console.error("Gagal mengecek autentikasi", error);
        window.location.replace("../login/login.html");
    }
}

// Jalankan saat halaman dimuat
checkAuth();