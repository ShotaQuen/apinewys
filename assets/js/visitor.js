fetch('http://ikannnew.vercel.app/status/visitor')
    .then(response => response.json())
    .then(data => {
      const count = data.totalVisitors;
      document.getElementById('visitor-count').textContent = new Intl.NumberFormat('id-ID').format(count);
    })
    .catch(error => {
      console.error('Gagal memuat visitor:', error);
      document.getElementById('visitor-count').textContent = '0';
    });