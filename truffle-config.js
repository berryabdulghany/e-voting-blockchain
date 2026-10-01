module.exports = {
  // Konfigurasi Jaringan (Network)
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,            
      network_id: "5777"     
    }
  },

  // Konfigurasi Compiler (DISESUAIKAN)
  compilers: {
    solc: {
      version: "0.5.15",      // <--- Kita ubah jadi 0.5.15 sesuai error log
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};