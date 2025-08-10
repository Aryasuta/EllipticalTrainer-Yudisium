const BASE_URL = 'https://elliptical-backend.vercel.app';  // URL API server
let pollingInterval;
let sessionEnded = false;

document.addEventListener('DOMContentLoaded', function() {
  // Disable all buttons initially
  document.querySelector('.start-monitoring').disabled = true;
  document.querySelector('.update-weight').disabled = true;
  document.querySelector('.history-button').disabled = true;

  // Automatically start scanning for the RFID card
  startMonitoring();
});

function startMonitoring() {
  document.getElementById('status').innerText = '⏳ Waiting for RFID card...';
  document.getElementById('card-status').innerText = '';
  document.getElementById('results').style.display = 'none';  // Hide results initially
  sessionEnded = false;

  let attempt = 0;

  pollingInterval = setInterval(async () => {
    try {
      const res = await fetch(BASE_URL + '/scan/card');
      attempt++;

      if (res.ok) {
        const data = await res.json();

        if (!data.cardId) return;

        clearInterval(pollingInterval);
        localStorage.setItem('activeCardId', data.cardId);
        await fetch(BASE_URL + '/scan/card/clear', { method: 'POST' });

        const checkRes = await fetch(BASE_URL + '/sessions/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId: data.cardId })
        });

        const checkData = await checkRes.json();

        if (checkData.userExists) {
          document.getElementById('card-status').innerText = '✅ Kartu Anda berhasil dipindai. Silahkan pilih fitur diatas.';
          document.getElementById('status').innerText = '🚴 Sesi latihan sudah siap. Anda bisa memulai sesi latihan.';
          document.getElementById('scan-warning').style.display = 'none';
          
          // Enable buttons after card is scanned
          document.querySelector('.start-monitoring').disabled = false;
          document.querySelector('.update-weight').disabled = false;
          document.querySelector('.history-button').disabled = false;

          // Attach event listeners after enabling buttons
          attachEventListeners();

          setTimeout(() => startEndPolling(), 1500);
        } else {
          window.location.href = `/Frontend/public/signup.html`;
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, 2000);
}

function goToHistoryPage() {
  const cardId = localStorage.getItem('activeCardId');
  if (cardId) {
    window.location.href = 'History.html';
  } else {
    alert("Scan kartu terlebih dahulu untuk melihat riwayat sesi.");
  }
}

function startEndPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  pollingInterval = setInterval(async () => {
    try {
      const res = await fetch(BASE_URL + '/sessions/active-latest');
      
      if (res.status === 404 && !sessionEnded) {
        // Tanda bahwa sesi telah berakhir
        sessionEnded = true;
        clearInterval(pollingInterval);

        const cardId = localStorage.getItem('activeCardId');
        document.getElementById('card-status').innerText = '✅ Sesi berakhir.';
        document.getElementById('status').innerText = '⏳ Mengambil hasil latihan...';

        setTimeout(() => fetchFinalSession(cardId), 1500);
      }
    } catch (err) {
      console.error('Polling error on end:', err);
    }
  }, 2000);
}

async function fetchFinalSession(cardId) {
  try {
    const res = await fetch(BASE_URL + '/sessions/' + cardId);
    const data = await res.json();

    if (data.sessions && data.sessions.length > 0) {
      const session = data.sessions[0];
      // Tampilkan hasil sesi setelah selesai
      document.getElementById('status').innerText = '✅ Sesi selesai.';
      document.getElementById('distance').innerText = session.distance?.toFixed(2) ?? '0';
      document.getElementById('calories').innerText = session.calories?.toFixed(2) ?? '0';
      document.getElementById('results').style.display = 'block';
    } else {
      alert('❌ Sesi tidak ditemukan.');
    }
  } catch (err) {
    console.error('❌ Gagal ambil sesi:', err);
    alert('Gagal mengambil data sesi.');
  }
}

// Function to attach event listeners to buttons after enabling
function attachEventListeners() {
  // Attach listener to Start Monitoring button
  document.querySelector('.start-monitoring').addEventListener('click', function() {
    // Start monitoring logic here
    document.getElementById('status').innerText = '🚴 Sesi latihan dimulai! Semangat berolahraga!';
    document.getElementById('card-status').innerText = '✅ Sesi latihan Anda sudah dimulai.';
    document.getElementById('scan-warning').style.display = 'none'; // Menyembunyikan pesan scan

    // Simulate starting a session
    startEndPolling();  // Begin the polling for active session
  });

  // Attach listener to Update Weight button
  document.querySelector('.update-weight').addEventListener('click', async function() {
    // Update weight logic here - Prompt user to input weight
    const weight = prompt('Masukkan berat badan (kg):');
    
    if (weight) {
      // Store the weight to localStorage for display purposes
      localStorage.setItem('weight', weight);
      

      // Get cardId from localStorage
      const cardId = localStorage.getItem('activeCardId');

      if (cardId) {
        try {
          // Send the updated weight to the server
          const res = await fetch(`${BASE_URL}/users/${cardId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ weight: weight }),  // Sending the new weight
          });

          const data = await res.json();
          if (res.ok) {
            alert('✅ Berat badan berhasil diperbarui menjadi: ' + weight + ' kg');
          } else {
            alert('❌ Gagal memperbarui berat badan: ' + data.message);
          }
        } catch (err) {
          console.error('Error saat mengupdate berat badan:', err);
          alert('❌ Terjadi kesalahan saat memperbarui berat badan.');
        }
      } else {
        alert('❗ Kartu tidak terdeteksi. Mohon scan kartu terlebih dahulu.');
      }
    } else {
      alert('Input berat badan dibatalkan.');
    }
  });

  // Attach listener to View History button
  document.querySelector('.history-button').addEventListener('click', goToHistoryPage);
}


