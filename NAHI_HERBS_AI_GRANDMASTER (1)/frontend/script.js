const $ = (id) => document.getElementById(id);
const camera = $('camera'), preview = $('preview'), upload = $('upload');
const emptyState = $('emptyState'), analyzeBtn = $('analyze'), statusEl = $('status');
let stream = null, selectedFile = null, previewUrl = null;

function setStatus(message, kind='') { statusEl.textContent = message; statusEl.dataset.kind = kind; }
function stopCamera() {
  if (stream) stream.getTracks().forEach(track => track.stop());
  stream = null; camera.pause(); camera.srcObject = null; camera.style.display = 'none';
  $('capture').disabled = true; $('startCamera').textContent = '▣ Use camera';
}
function showImage(src) {
  preview.src = src; preview.style.display = 'block'; camera.style.display = 'none';
  emptyState.style.display = 'none'; $('imageBadge').style.display = 'block';
  document.querySelectorAll('.corner').forEach(el => el.style.display = 'block');
  analyzeBtn.disabled = !selectedFile;
}
function resetImage() {
  stopCamera(); selectedFile = null; upload.value = '';
  if (previewUrl) URL.revokeObjectURL(previewUrl); previewUrl = null;
  preview.removeAttribute('src'); preview.style.display = 'none'; emptyState.style.display = 'flex';
  $('imageBadge').style.display = 'none'; document.querySelectorAll('.corner').forEach(el => el.style.display='none');
  analyzeBtn.disabled = true; $('clearImage').textContent = 'Reset image'; setStatus('Add a photo to begin your scan.');
}
$('startCamera').addEventListener('click', async () => {
  if (!navigator.mediaDevices?.getUserMedia) { setStatus('Camera access needs HTTPS or localhost. You can upload a photo instead.', 'error'); return; }
  try {
    stopCamera();
    stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
    camera.srcObject = stream; camera.style.display='block'; preview.style.display='none'; emptyState.style.display='none';
    $('imageBadge').style.display='none'; $('capture').disabled=false; $('startCamera').textContent='▣ Camera on';
    await camera.play(); setStatus('Camera ready. Frame the plant, then capture.');
  } catch(err) { setStatus('Could not open camera. Check browser permission or upload an image instead.', 'error'); }
});
$('capture').addEventListener('click', () => {
  if (!stream || !camera.videoWidth) { setStatus('Wait for the camera to finish loading.'); return; }
  const canvas = document.createElement('canvas'); canvas.width=camera.videoWidth; canvas.height=camera.videoHeight;
  canvas.getContext('2d').drawImage(camera,0,0); canvas.toBlob(blob => {
    if (!blob) { setStatus('Could not capture the photo. Please try again.','error'); return; }
    selectedFile = new File([blob], 'plant-capture.jpg', {type:'image/jpeg'});
    if (previewUrl) URL.revokeObjectURL(previewUrl); previewUrl=URL.createObjectURL(blob);
    stopCamera(); showImage(previewUrl); setStatus('Photo captured. Ready for analysis.');
  },'image/jpeg',.92);
});
upload.addEventListener('change', () => {
  const file = upload.files?.[0]; if (!file) return;
  if (!file.type.startsWith('image/')) { setStatus('Please choose an image file.','error'); upload.value=''; return; }
  if (file.size > 12*1024*1024) { setStatus('Image is larger than 12 MB. Choose a smaller photo.','error'); upload.value=''; return; }
  stopCamera(); selectedFile=file;
  if (previewUrl) URL.revokeObjectURL(previewUrl); previewUrl=URL.createObjectURL(file);
  showImage(previewUrl); setStatus('Photo loaded. Ready for analysis.');
});
$('clearImage').addEventListener('click',resetImage);
const dropzone=$('dropzone');
dropzone.addEventListener('dragover',e=>{e.preventDefault();dropzone.style.outline='2px solid #1b7049'});
dropzone.addEventListener('dragleave',()=>dropzone.style.outline='');
dropzone.addEventListener('drop',e=>{e.preventDefault();dropzone.style.outline='';const file=e.dataTransfer.files?.[0];if(file&&file.type.startsWith('image/')){const dt=new DataTransfer();dt.items.add(file);upload.files=dt.files;upload.dispatchEvent(new Event('change'));}});
function escapeHTML(s='') { return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function renderReport(r, demo=false) {
  const confidence=Math.max(0,Math.min(100,Number(r.confidence)||0));
  $('resultContent').innerHTML = `<div class="report-placeholder"><div class="report-icon">✧</div><div><span class="report-status">${demo?'SAMPLE REPORT · DEMO MODE':'AI-ASSISTED OBSERVATION'}</span><h3>${escapeHTML(r.plant||'Plant observation')}</h3><p>${escapeHTML(r.health_status||'Review the observations below.')}</p></div><span class="placeholder-number">FIELD REPORT / 001</span></div>
  <div class="report-grid">
    <div class="report-cell"><small>01 / POSSIBLE ISSUE</small><h4>${escapeHTML(r.possible_disease||'Needs further observation')}</h4><p>${escapeHTML(r.symptoms||'Compare the plant with a healthy example and note any changes.')}</p><div class="confidence-track"><span style="width:${confidence}%"></span></div><p style="margin-top:7px">Confidence estimate: ${confidence}%</p></div>
    <div class="report-cell"><small>02 / NEXT STEPS</small><h4>What to do next</h4><p>${escapeHTML(r.treatment||'Take a sharper photo and seek advice from a qualified local agricultural professional before treating.')}</p></div>
    <div class="report-cell"><small>03 / PREVENTION</small><h4>Reduce future risk</h4><p>${escapeHTML(r.prevention||'Monitor watering, drainage, spacing, and changes in new growth.')}</p></div>
    <div class="report-cell"><small>04 / IMPORTANT NOTE</small><h4>Verify before treatment</h4><p>${escapeHTML(r.warning||'Photo-based observations can be wrong. Confirm any suspected disease with an agricultural expert before applying chemicals.')}</p></div>
  </div><div class="report-disclaimer">${demo?'This is illustrative sample content, not an analysis of your uploaded image.':'AI output is an aid, not a definitive diagnosis. Confirm important decisions with a qualified agricultural professional.'} <button class="btn btn-outline" id="copyReport" style="float:right;padding:8px 10px;font-size:9px">Copy report</button></div>`;
  $('copyReport').addEventListener('click',async()=>{const text=`${r.plant}\n${r.health_status}\nPossible issue: ${r.possible_disease}\nSymptoms: ${r.symptoms}\nTreatment: ${r.treatment}\nPrevention: ${r.prevention}\nWarning: ${r.warning}`;try{await navigator.clipboard.writeText(text);$('copyReport').textContent='Copied ✓'}catch(e){$('copyReport').textContent='Copy unavailable'}});
}
const demoReport={plant:'Plant not verified',health_status:'Sample report — demo mode',possible_disease:'No image diagnosis performed',confidence:0,symptoms:'This sample report demonstrates the report layout only. It does not describe the plant in your photo.',treatment:'Connect the optional Python backend and configure an AI API key to request image-based observations. Until then, compare the plant with a healthy specimen and ask a local extension worker for advice.',prevention:'Use clear photos in natural light, record when symptoms started, and check watering, drainage, and recent environmental changes.',warning:'Demo mode is not a diagnosis. Do not apply pesticides or other agricultural chemicals based only on this sample report.'};
analyzeBtn.addEventListener('click',async()=>{
  if(!selectedFile) return;
  analyzeBtn.disabled=true; analyzeBtn.innerHTML='<span class="btn-spark">✦</span> Analyzing image… <span>◌</span>'; setStatus('Preparing your image for analysis…');
  try {
    const form=new FormData();form.append('image',selectedFile);
    let response;
    try { response=await fetch('http://127.0.0.1:5000/analyze',{method:'POST',body:form}); }
    catch(e) { response=null; }
    if(response && response.ok) {
      const data=await response.json(); if(!data.success) throw new Error(data.error||'Analysis service returned an error.');
      renderReport(data.report||data,false); setStatus('AI-assisted report generated. Review it carefully.','success');
    } else {
      await new Promise(resolve=>setTimeout(resolve,500));
      renderReport(demoReport,true); setStatus('Sample report shown. Start the optional backend for real image analysis.','info');
    }
    $('reportSection').scrollIntoView({behavior:'smooth',block:'start'});
  } catch(err) { setStatus(err.message||'Analysis failed. Please try again.','error'); }
  finally { analyzeBtn.disabled=!selectedFile; analyzeBtn.innerHTML='<span class="btn-spark">✦</span> Analyze with Nahi AI <span>→</span>'; }
});
$('locationButton').addEventListener('click',()=>{
  const target=$('locationResult');
  if(!navigator.geolocation){target.textContent='Location is not supported by this browser.';return;}
  target.textContent='Requesting location permission…';
  navigator.geolocation.getCurrentPosition(pos=>{target.textContent=`Coordinates: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} · Accuracy approx. ${Math.round(pos.coords.accuracy)} m`;},err=>{target.textContent=err.code===1?'Location permission was denied. You can still use the plant scanner.':'Could not get location. Check permissions and try again.';},{enableHighAccuracy:false,timeout:10000,maximumAge:60000});
});
$('themeToggle').addEventListener('click',()=>{document.body.classList.toggle('dark');$('themeToggle').textContent=document.body.classList.contains('dark')?'☼':'◐';});
window.addEventListener('beforeunload',stopCamera);
