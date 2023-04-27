document
  .querySelector('#searchValue')
  .addEventListener('input', async (event) => {
    var searchedSongs = await fetch('/searchSongs', {
      headers: { 'Content-Type': 'application/json' },
      method: 'post',
      body: JSON.stringify({
        song:
          document.querySelector('#searchValue').value != ''
            ? document.querySelector('#searchValue').value
            : ' ',
      }),
    })
    try {
      searchedSongs = await searchedSongs.json()
    } catch (err) {}
    searchedSongs = searchedSongs.data
    if (searchedSongs.length > 0) {
      var clutter = ''
      searchedSongs.forEach((mus, index) => {
        clutter += `<div class="container-fluid"
    onclick="play( '${mus.name}', '${mus.poster}','${mus.title}','${mus.artist}','${mus._id}')"
    
    >
    <div class="row">
      <div class="col-12">
        <div class="flex-container">
          <div class="card flex-item">
            <img
              src="/image/${mus.poster}"
              alt="thumbnail"
              class="img-fluid card-img-top"
              style="pointer-events:none;"
            />
            <div class="card-block">
              <h4 style="pointer-events:none;" class="card-title mt-3">${mus.title}</h4>
              <p style="pointer-events:none;" class="card-title opacity-75">${mus.artist}</p>
              <div class="play-button"
             
              >
                <div
                onclick="play( '${mus.name}', '${mus.poster}','${mus.title}','${mus.artist}','${mus._id}')"
                  class="playButton btn border-0 d-flex align-items-center justify-content-center p-0"
                >
                  <i class="ri-play-circle-fill"></i>
                  <i class="ri-pause-circle-fill"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`
      })

      document.querySelector('.searches').innerHTML = clutter
    }
  })
