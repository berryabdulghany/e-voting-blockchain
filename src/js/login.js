// ============================================================
// 1. LOGIKA CONNECT WALLET (METAMASK)
// ============================================================
const connectBtn = document.getElementById('connectWalletBtn');
const walletText = document.getElementById('walletAddress');

// Pastikan ID ini SAMA PERSIS dengan di HTML
const voterIdInput = document.getElementById('voter-id'); // <--- INI KUNCINYA
const passInput = document.getElementById('password');
const loginBtn = document.querySelector('.btn-login');

if (connectBtn) {
    connectBtn.addEventListener('click', async () => {
        if (window.ethereum) {
            try {
                // Efek Loading di Tombol
                connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghubungkan...';
                
                // Minta akses wallet
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const account = accounts[0];
                
                // Ubah Tampilan Tombol jadi Sukses
                connectBtn.innerHTML = '<i class="fas fa-check-circle"></i> Terhubung';
                connectBtn.classList.add('connected');
                
                // Tampilkan Address
                walletText.style.display = 'block';
                walletText.innerText = "Dompet Aktif: " + account.substring(0, 6) + "..." + account.substring(38);
                
                // --- BUKA GEMBOK FORM (ENABLE INPUT) ---
                if(voterIdInput) voterIdInput.disabled = false;
                if(passInput) passInput.disabled = false;
                if(loginBtn) loginBtn.disabled = false;
                
                // Fokus ke input biar user langsung ngetik
                if(voterIdInput) {
                    voterIdInput.placeholder = "Masukkan NIM";
                    voterIdInput.focus();
                }

                // Notifikasi Toast
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
                Toast.fire({ icon: 'success', title: 'MetaMask Terhubung' });

            } catch (error) {
                console.error(error);
                connectBtn.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" width="25"> Hubungkan MetaMask';
                Swal.fire('Gagal', 'Koneksi dibatalkan atau error.', 'error');
            }
        } else {
            Swal.fire('Error', 'MetaMask tidak terdeteksi!', 'error');
        }
    });
}

// ============================================================
// 2. LOGIKA LOGIN KE PYTHON
// ============================================================
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault(); 

        const voter_id = document.getElementById('voter-id').value;
        const password = document.getElementById('password').value;
        
        // Cek data kosong
        if (!voter_id || !password) {
            Swal.fire('Ups!', 'Isi NIM dan Password dulu.', 'warning');
            return;
        }

        // Loading
        Swal.fire({
            title: 'Memverifikasi...',
            text: 'Menghubungkan ke Server...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        const token = voter_id; 
        const headers = { 'method': "GET", 'Authorization': `Bearer ${token}` };

        // Fetch
        fetch(`http://127.0.0.1:8000/login?voter_id=${voter_id}&password=${password}`, { headers })
        .then(response => {
            if (response.ok) return response.json();
            else throw new Error('Login failed');
        })
        .then(data => {
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                if (data.role === 'admin') {
                    localStorage.setItem('jwtTokenAdmin', data.token);
                    window.location.replace(`admin.html?Authorization=Bearer ${data.token}`);
                } else if (data.role === 'user'){
                    localStorage.setItem('jwtTokenVoter', data.token);
                    window.location.replace(`index.html?Authorization=Bearer ${data.token}`);
                }
            });
        })
        .catch(error => {
            Swal.fire({ icon: 'error', title: 'Gagal Masuk', text: 'NIM/Password Salah atau Server Python Mati.' });
        });
    });
}