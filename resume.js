(function () {
  'use strict';

  var PDF_FILENAME = 'Rathod-Jenil-CV.pdf';

  /**
   * @param {string} src
   * @returns {Promise<void>}
   */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () {
        resolve();
      };
      s.onerror = function () {
        reject(new Error('Failed to load script: ' + src));
      };
      document.head.appendChild(s);
    });
  }

  /**
   * @param {{ jsPDF: any; html2canvas: any }} libs
   * @returns {Promise<void>}
   */
  function generatePdfFromElement(libs) {
    var el = document.getElementById('resume-to-pdf');
    if (!el) {
      return Promise.reject(new Error('Resume element not found'));
    }

    var html2canvas = libs.html2canvas;
    var jsPDF = libs.jsPDF;

    return html2canvas(el, {
      scale: Math.min(window.devicePixelRatio || 2, 2),
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    }).then(function (canvas) {
      var imgData = canvas.toDataURL('image/png');
      var pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      var pageWidth = pdf.internal.pageSize.getWidth();
      var pageHeight = pdf.internal.pageSize.getHeight();
      var pdfWidth = pageWidth;
      var pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      var heightLeft = pdfHeight;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 1) {
        var y = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, y, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(PDF_FILENAME);
    });
  }

  async function handleDownload() {
    if (typeof window.jspdf !== 'undefined' && typeof window.jspdf.jsPDF !== 'undefined' &&
        typeof window.html2canvas !== 'undefined') {
      return generatePdfFromElement({
        jsPDF: window.jspdf.jsPDF,
        html2canvas: window.html2canvas
      });
    }

    try {
      await loadScript(
        'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
      );
      await loadScript(
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      );
      if (
        typeof window.jspdf !== 'undefined' &&
        typeof window.jspdf.jsPDF !== 'undefined' &&
        typeof window.html2canvas !== 'undefined'
      ) {
        return generatePdfFromElement({
          jsPDF: window.jspdf.jsPDF,
          html2canvas: window.html2canvas
        });
      }
      throw new Error('PDF libraries not available after loading');
    } catch (err) {
      console.error(err);
      window.alert(
        'Could not load PDF tools or generate the file. Try again with an internet connection, or use Print → Save as PDF from your browser menu.'
      );
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('cv-download-btn');
    if (!btn) return;

    btn.addEventListener('click', async function () {
      btn.disabled = true;
      var label = btn.textContent;
      btn.textContent = 'Preparing PDF…';

      document.body.classList.add('pdf-capture');

      try {
        await handleDownload();
      } finally {
        document.body.classList.remove('pdf-capture');
        btn.disabled = false;
        btn.textContent = label;
      }
    });
  });
})();
