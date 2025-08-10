const BASE_URL = 'https://elliptical-backend.vercel.app';  // URL API server

document.addEventListener('DOMContentLoaded', function() {
  const cardId = localStorage.getItem('activeCardId');  // Ambil cardId dari localStorage

  if (!cardId) {
    alert("No active card found! Please scan your card first.");
    return;
  }

  document.getElementById('history-results').innerHTML = '<p>Loading...</p>';

  fetch(`${BASE_URL}/sessions/${cardId}`)
    .then(response => response.json())
    .then(data => {
      if (data.sessions && data.sessions.length > 0) {
        let historyHTML = '';
        const totalSessions = data.sessions.length;  // Total jumlah sesi yang ada

        // Iterasi sesi dan tampilkan sesi mulai dari yang terakhir
        data.sessions.forEach((session, index) => {
          const sessionNumber = totalSessions - index;  // Menghitung nomor sesi mundur
          
          historyHTML += `
            <div class="history-item">
              <p><strong>Sesi Latihan #${sessionNumber}</strong></p>
              <p><strong>Distance:</strong> ${session.distance} meters</p>
              <p><strong>Calories Burned:</strong> ${session.calories} kcal</p>
            </div>
          `;
        });

        document.getElementById('history-results').innerHTML = historyHTML;
      } else {
        document.getElementById('history-results').innerHTML = '<p>No session history found.</p>';
      }
    })
    .catch(err => {
      console.error('Error fetching session history:', err);
      document.getElementById('history-results').innerHTML = '<p>Error loading history. Please try again later.</p>';
    });
});
