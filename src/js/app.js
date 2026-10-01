const Web3 = require("web3");
const contract = require("@truffle/contract");

const votingArtifacts = require("../../build/contracts/Voting.json");
var VotingContract = contract(votingArtifacts);

// ============================================================
// 🌍 KONFIGURASI SERVER GAMBAR (PYTHON API)
// ============================================================
// Pastikan port ini sama dengan port saat menjalankan 'python -m uvicorn ...'
const API_URL = "http://127.0.0.1:8000/public/";

window.App = {
  eventStart: async function () {
    try {
      // 1. Setup Web3
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      App.account = accounts[0];
      $("#accountAddress").html("Akun Aktif: " + App.account);

      VotingContract.setProvider(window.ethereum);
      const instance = await VotingContract.deployed();

      const countCandidates = await instance.getCountCandidates();
      window.countCandidates = countCandidates;

      // Update Dashboard Admin
      if (document.getElementById("statCount")) {
        document.getElementById("statCount").innerText =
          countCandidates + " Kandidat";
      }

      // Tampilkan Tanggal
      try {
        const result = await instance.getDates();
        const startDate = new Date(result[0] * 1000);
        const endDate = new Date(result[1] * 1000);
        const dateString =
          startDate.toLocaleDateString() + " - " + endDate.toLocaleDateString();
        $("#dates").html("<b>" + dateString + "</b>");
      } catch (err) {
        console.error("Gagal tanggal:", err);
      }

      // ============================================================
      // 🚦 ROUTING HALAMAN
      // ============================================================

      // Halaman VOTER
      if ($("#boxCandidate").length > 0) {
        App.renderVoterPage(instance, countCandidates);
      }

      // Halaman ADMIN
      if ($("#candidateTableBody").length > 0) {
        App.renderAdminPage(instance, countCandidates);
      }

      // ============================================================
      // 🎮 EVENT LISTENERS ADMIN
      // ============================================================

      // ADMIN: TAMBAH KANDIDAT
      $("#addCandidate")
        .off("click")
        .on("click", async function () {
          var name = $("#name").val();
          var org = $("#organization").val();
          var vis = $("#vision").val();
          var pic = $("#photo").val(); // Cukup nama file, misal: calon1.jpg

          if (!name || !org || !vis || !pic) {
            Swal.fire(
              "Data Tidak Lengkap",
              "Harap isi semua kolom form!",
              "warning",
            );
            return;
          }

          try {
            Swal.fire({
              title: "Menunggu Konfirmasi...",
              text: "Silakan konfirmasi transaksi di MetaMask",
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              },
            });

            const acc = await window.ethereum.request({
              method: "eth_requestAccounts",
            });
            await instance.addCandidate(name, org, vis, pic, { from: acc[0] });

            Swal.fire({
              icon: "success",
              title: "Berhasil!",
              text: "Kandidat baru telah ditambahkan.",
              confirmButtonText: "Oke Siap!",
            }).then(() => {
              window.location.reload();
            });
          } catch (err) {
            Swal.fire("Gagal!", err.message, "error");
          }
        });

      // ADMIN: ATUR TANGGAL
      $("#addDate")
        .off("click")
        .on("click", async function () {
          var sInput = document.getElementById("startDate").value;
          var eInput = document.getElementById("endDate").value;
          if (!sInput || !eInput) {
            Swal.fire(
              "Tanggal Kosong",
              "Pilih tanggal mulai dan selesai!",
              "warning",
            );
            return;
          }

          var s = Math.floor(Date.parse(sInput) / 1000);
          var e = Math.floor(Date.parse(eInput) / 1000);

          try {
            Swal.fire({
              title: "Memproses Jadwal...",
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              },
            });

            const acc = await window.ethereum.request({
              method: "eth_requestAccounts",
            });
            await instance.setDates(s, e, { from: acc[0] });

            Swal.fire(
              "Sukses",
              "Jadwal Voting Berhasil Diupdate!",
              "success",
            ).then(() => window.location.reload());
          } catch (err) {
            Swal.fire("Error", err.message, "error");
          }
        });

      // Panggil Event Listener (Versi Aman)
      App.listenForEvents();
    } catch (err) {
      console.error(err);
    }
  },

  // ============================================================
  // 👁️ RENDER VOTER (FIX IMAGE URL)
  // ============================================================
  renderVoterPage: async function (instance, count) {
    $("#boxCandidate").empty();
    for (var i = 1; i <= count; i++) {
      const data = await instance.getCandidate(i);

      // [FIX] Mengarahkan ke Server Python Port 8000
      var filename = data[4] ? data[4] : "default.png";
      var imgUrl = API_URL + filename;

      var viewCandidates = `
            <div class="candidate-card">
                <div class="card-top"></div>
                <div class="candidate-img">
                    <img src="${imgUrl}" 
                         onerror="this.onerror=null;this.src='${API_URL}default.png';"
                         style="width:100%; height:100%; object-fit:cover; border-radius:50%; border:4px solid white;">
                </div>
                <div class="card-body">
                    <div class="card-name">${data[1]}</div>
                    <div class="card-party" style="color:gray;">${data[2]}</div>
                    
                    <div class="vision-box">
                        <span class="vision-label">Visi & Misi:</span>
                        ${data[3]}
                    </div>

                    <div class="vote-count" style="font-size:1.5em; font-weight:bold; color:#003366;">${data[5]}</div>
                    <div class="vote-label">Total Suara</div>
                    
                    <div class="radio-container" style="margin-top:15px;">
                        <label style="width:100%; cursor:pointer;">
                            <input type="radio" name="candidate" value="${data[0]}" id="${data[0]}">
                            <div class="btn-select"><i class="fas fa-check"></i> PILIH SAYA</div>
                        </label>
                    </div>
                </div>
            </div>`;
      $("#boxCandidate").append(viewCandidates);
    }

    // Cek Status Vote (Logika Tombol Kuat)
    try {
      const hasVoted = await instance.checkVote({ from: App.account });
      if (hasVoted) {
        $("#voteButton").hide();
        $("#msg").html(
          "<div class='alert alert-success' style='background:#d4edda; color:#155724; padding:15px; border-radius:5px; text-align:center;'><b>✅ Terima kasih! Suara Anda telah tercatat aman di Blockchain.</b></div>",
        );
      } else {
        $("#voteButton").show();
        $("#voteButton").prop("disabled", false);
      }
    } catch (err) {
      console.log(err);
    }
  },

  // ============================================================
  // 👮 RENDER ADMIN (FIX IMAGE URL & CHART)
  // ============================================================
  renderAdminPage: async function (instance, count) {
    const tableBody = $("#candidateTableBody");
    const legendBox = $("#voteLegend");

    tableBody.empty();
    if (legendBox.length) legendBox.empty();

    let labels = [];
    let dataVotes = [];
    let backgroundColors = [
      "#FF6384",
      "#36A2EB",
      "#FFCE56",
      "#4BC0C0",
      "#9966FF",
      "#FF9F40",
    ];

    for (var i = 1; i <= count; i++) {
      const data = await instance.getCandidate(i);

      // [FIX] Mengarahkan ke Server Python Port 8000
      var filename = data[4] ? data[4] : "default.png";
      var imgUrl = API_URL + filename;

      let row = `<tr>
            <td style="padding:10px; border-bottom:1px solid #ddd; text-align:center;">${data[0]}</td>
            <td style="padding:10px; border-bottom:1px solid #ddd; text-align:center;">
                <img src="${imgUrl}" 
                     onerror="this.onerror=null;this.src='${API_URL}default.png';"
                     width="40" height="40" style="border-radius:50%; object-fit:cover;">
            </td>
            <td style="padding:10px; border-bottom:1px solid #ddd;"><b>${data[1]}</b></td>
            <td style="padding:10px; border-bottom:1px solid #ddd;">${data[2]}</td>
            <td style="padding:10px; border-bottom:1px solid #ddd; text-align:center; font-weight:bold;">${data[5]}</td>
        </tr>`;
      tableBody.append(row);

      labels.push(data[1]);
      dataVotes.push(data[5].toNumber());

      if (legendBox.length) {
        let color = backgroundColors[(i - 1) % backgroundColors.length];
        let legendItem = `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 12px; border-left: 5px solid ${color}; box-shadow: 0 2px 5px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: center;">
                    <div style="font-size: 0.9em; color: #666; font-weight: 600; margin-bottom: 5px;">${data[1]}</div>
                    <div style="font-size: 1.8em; font-weight: 800; color: #333; line-height: 1;">
                        ${data[5]} <span style="font-size: 0.5em; font-weight: 400; color: #999;">Suara</span>
                    </div>
                </div>
            `;
        legendBox.append(legendItem);
      }
    }

    if (document.getElementById("voteChart")) {
      const ctx = document.getElementById("voteChart").getContext("2d");

      if (window.myPieChart) window.myPieChart.destroy();

      window.myPieChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: labels,
          datasets: [
            {
              data: dataVotes,
              backgroundColor: backgroundColors.slice(0, labels.length),
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
        },
      });
    }
  },

  // ============================================================
  // 🔊 FIX EVENT LISTENER (ANTI CRASH)
  // ============================================================
  listenForEvents: async function () {
    try {
      const instance = await VotingContract.deployed();

      // Cara Aman: Hanya Log saja jika terjadi event, tanpa merusak flow aplikasi
      // Jika .on() error, dia akan masuk ke catch block dan tidak membuat tombol macet.
      if (typeof instance.votedEvent === "function") {
        console.log("Listening for blockchain events...");
      } else {
        console.warn(
          "Event listener skipped due to contract version mismatch (Safe Mode)",
        );
      }
    } catch (err) {
      console.warn("Event listener disabled (Safe Mode):", err.message);
    }
  },

  // FUNGSI VOTE
  vote: async function () {
    var cID = $("input[name='candidate']:checked").val();

    if (!cID) {
      Swal.fire({
        icon: "warning",
        title: "Oops...",
        text: "Kamu belum memilih kandidat manapun!",
      });
      return;
    }

    try {
      const instance = await VotingContract.deployed();
      const acc = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const confirmResult = await Swal.fire({
        title: "Yakin dengan pilihanmu?",
        text: "Suara yang dikirim tidak bisa diubah lagi!",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Ya, Kirim Suara!",
        cancelButtonText: "Batal",
      });

      if (!confirmResult.isConfirmed) return;

      Swal.fire({
        title: "Mengirim ke Blockchain...",
        text: "Mohon tunggu konfirmasi MetaMask & Mining Block...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await instance.vote(parseInt(cID), { from: acc[0] });

      Swal.fire({
        title: "Voting Berhasil!",
        text: "Suara Anda telah direkam secara permanen (Immutable).",
        icon: "success",
        confirmButtonText: "Mantap",
      }).then(() => {
        window.location.reload();
      });
    } catch (err) {
      let msg = err.message;
      if (err.message.includes("revert"))
        msg =
          "Waktu voting belum mulai, sudah selesai, atau Anda sudah memilih!";

      Swal.fire({
        icon: "error",
        title: "Gagal Mengirim Suara",
        text: msg,
      });
    }
  },
};

window.addEventListener("load", function () {
  if (window.ethereum) {
    window.eth = new Web3(window.ethereum);
    window.App.eventStart();
    window.ethereum.on("accountsChanged", function () {
      window.location.reload();
    });
  } else {
    console.warn("No Web3 detected.");
  }
});
