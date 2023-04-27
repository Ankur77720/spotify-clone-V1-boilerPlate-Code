let song = document.querySelector('#song')
let songProgress = document.querySelector('#songProgress')
let playButton = document.querySelector('#playSong')
let buttons = document.querySelector('.buttons')
let isPlaying = false
let isMuted = false
let queueIsOpen = true
let isSearOpen = false
let songName = document.querySelector('#song').getAttribute('src')
let lastState = [toHome]
let playListTitle = 'Your playlist'
let fromCurrentDevice = true

function play(songFile, img, title, artist, id) {
  if (fromCurrentDevice) {
    socket.emit('currentlyPlaying', {
      userId: user._id,
      music: { songFile, img, title, artist, id },
    })
  }
  songName = songFile
  songId = id
  var isInPlayList = false
  myLibrary.forEach((list) => {
    if (list._id == songId) {
      isInPlayList = true
    }
  })
  if (isInPlayList) {
    document.querySelector('#addToPlayList i').classList.add('text-success')
  } else {
    document.querySelector('#addToPlayList i').classList.remove('text-success')
  }
  if (likedSongs.indexOf(songId) == -1) {
    document.querySelector('#like').classList.remove('likedIt')
  } else {
    document.querySelector('#like').classList.add('likedIt')
  }
  song.setAttribute('src', `/file/${songFile}`)
  document.querySelector('#playerImg').setAttribute('src', `/image/${img}`)
  document.querySelector('#playerSongTitle').textContent = title
  var artists = ''
  artist.split('/').forEach((art) => {
    artists += '  ' + art
  })
  document.querySelector('#playerSongArtist').textContent = artists
  isPlaying = false
  playPause()
  song.addEventListener('loadeddata', (eve) => {
    songProgress.max = song.duration
    songProgress.value = song.currentTime
  })
}
async function likeIt() {
  var response = await fetch(`/like/${songName.replace('/file/', '')}`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
  })
  response = await response.json()
  if (response.status == 'liked') {
    document.querySelector('#like').classList.add('likedIt')
    likedSongs.push(songId)
  } else {
    document.querySelector('#like').classList.remove('likedIt')
    likedSongs.splice(1, likedSongs.indexOf(songId))
  }
}
async function addToPlayList(playList_id) {
  var response = await fetch(
    `/addToPlayList/${playList_id}/${songName.replace('/file/', '')}`,
    {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
    },
  )
  response = await response.json()
  if (response.status == 'added') {
    myLibrary.push(response.music)
    document.querySelector('#addToPlayList i').classList.add('text-success')
  } else {
    myLibrary.splice(1, myLibrary.indexOf(response.music))
    document.querySelector('#addToPlayList i').classList.remove('text-success')
  }
}
async function openPlayList(artistName) {
  lastState.push(openPlayListTab)
  var data = JSON.stringify({
    artist: artistName,
  })
  var artistSongs = await fetch('/artist', {
    headers: { 'Content-Type': 'application/json' },
    method: 'post',
    body: data,
  })
  artistSongs = await artistSongs.json()
  queue = artistSongs.musics
  document.querySelector('.mainContent').style.display = 'none'
  document.querySelector('#musics').style.display = 'initial'
  openMusic(artistSongs.musics, `Songs by ${artistName}`)
  queueIsOpen = false
}
async function openPlaylist(playlist_id) {
  var playlist = await fetch(`/getPlaylist/${playlist_id}`, {
    headers: { 'Content-Type': 'application/json' },
    method: 'post',
  })
  playlist = await playlist.json()
  playlist = playlist
  queue = playlist.playlist
  playListTitle = playlist.title
  toQueue()
}

async function openSearch() {
  if (`${document.querySelector('.searches').innerHTML}` == '') {
    var searches = await fetch('/randomSongs', {
      headers: { 'Content-Type': 'application/json' },
      method: 'post',
    })
    searches = await searches.json()
    searches = searches.musics
    var clutter = ''
    searches.forEach((mus, index) => {
      clutter += `<div class="container-fluid"
    onclick="play( '${mus.name}', '${mus.poster}','${mus.title}','${
        mus.artist
      }','${mus._id}')"
    
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
              <h4 style="pointer-events:none;" class="card-title mt-3">${
                mus.title
              }</h4>
              <p style="pointer-events:none;" class="card-title opacity-75">${
                mus.artist
              }</p>
              <div class="play-button"
             
              >
                <div
                onclick="play( '${mus.name}', '${
        mus.poster
      }','${mus.title
        .replace(/'/g, '`')
        .replace(/"/g, '`')}','${mus.artist
        .replace(/'/g, '"')
        .replace(/"/g, '`')}','${mus._id}')"
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

  toSearch()
}

async function createPlayList(eve) {
  eve.preventDefault()
  var res = await fetch('/createPlayList', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playListName: document.querySelector('#playListName').value,
    }),
  })
  res = await res.json()
  if (res.status == 'success') {
    var myModalEl = document.getElementById('exampleModalCenter')
    var modal = bootstrap.Modal.getInstance(myModalEl)
    modal.hide()
    user.playlists.push(res.newPlayList)
    document.querySelector('#addTo_playlists').innerHTML =
      `<a
    class="dropdown-item btn btn-dark"
    onclick="addToPlayList('${res.newPlayList._id}')"
  >
    Add to ${res.newPlayList.title}</a
  >` + document.querySelector('#addTo_playlists').innerHTML
    toLibrary()
  }
}
document.querySelector('#createPlayList').addEventListener('submit', (eve) => {
  createPlayList(eve)
})

async function openPlayListTab() {
  var clutter = ''
  myLibrary.forEach((mus, index) => {
    clutter += `<div class="container-fluid"
    onclick="play( '${mus.name}', '${mus.poster}','${mus.title}','${
      mus.artist
    }','${mus._id}' )"
    
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
              <h4 style="pointer-events:none;" class="card-title mt-3">${
                mus.title
              }</h4>
              <p style="pointer-events:none;" class="card-title opacity-75">${
                mus.artist
              }</p>
              <div class="play-button"
             
              >
                <div
                onclick="play( '${mus.name}', '${
      mus.poster
    }','${mus.title
      .replace(/'/g, '`')
      .replace(/"/g, '`')}','${mus.artist
      .replace(/'/g, '"')
      .replace(/"/g, '`')}','${mus._id}')"
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
  document.querySelector('.likes').innerHTML = clutter
  toLiked()
  removeActive()
  document.querySelector('#playListTab').classList.add('active')
}
async function openLiked() {
  var searches = await fetch('/liked', {
    headers: { 'Content-Type': 'application/json' },
    method: 'post',
  })
  searches = await searches.json()
  searches = searches.musics
  var clutter = ''
  searches.forEach((mus, index) => {
    clutter += `<div class="container-fluid"
    onclick="play( '${mus.name}', '${mus.poster}','${mus.title}','${
      mus.artist
    }','${mus._id}' )"
    
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
              <h4 style="pointer-events:none;" class="card-title mt-3">${
                mus.title
              }</h4>
              <p style="pointer-events:none;" class="card-title opacity-75">${
                mus.artist
              }</p>
              <div class="play-button"
             
              >
                <div
                onclick="play( '${mus.name}', '${
      mus.poster
    }','${mus.title
      .replace(/'/g, '`')
      .replace(/"/g, '`')}','${mus.artist
      .replace(/'/g, '"')
      .replace(/"/g, '`')}','${mus._id}')"
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
  document.querySelector('.likes').innerHTML = clutter
  toLiked()
}

function toLastState() {
  try {
    if (lastState.length > 2) {
      var temp = lastState.splice(1, lastState.length - 1)
      temp = temp[0]
      temp()
    } else {
      document.querySelector('.liked').style.display = 'none'
      document.querySelector('.mainContent').style.display = 'flex'
      document.querySelector('#musics').style.display = 'none'
      document.querySelector('.searche').style.display = 'none'
      queueIsOpen = !queueIsOpen
      isSearOpen = false
      removeActive()
      document.querySelector('#home').classList.add('active')
    }
  } catch (err) {}
}

function toHome() {
  lastState.push(toHome)
  document.querySelector('.liked').style.display = 'none'
  document.querySelector('.mainContent').style.display = 'flex'
  document.querySelector('#musics').style.display = 'none'
  document.querySelector('.searche').style.display = 'none'
  document.querySelector('.library').style.display = 'none'

  queueIsOpen = !queueIsOpen
  isSearOpen = false
  removeActive()
  document.querySelector('#home').classList.add('active')
}
function toQueue() {
  lastState.push(toQueue)
  document.querySelector('.liked').style.display = 'none'
  document.querySelector('.mainContent').style.display = 'none'
  document.querySelector('.searche').style.display = 'none'
  document.querySelector('.library').style.display = 'none'

  document.querySelector('#musics').style.display = 'initial'
  openMusic(queue, playListTitle)
  queueIsOpen = !queueIsOpen
  // playButtosFunco()
}
function toSearch() {
  lastState.push(toSearch)
  document.querySelector('.liked').style.display = 'none'
  document.querySelector('.mainContent').style.display = 'none'
  document.querySelector('.searche').style.display = 'initial'
  document.querySelector('.library').style.display = 'none'
  document.querySelector('#musics').style.display = 'none'
  openMusic(queue, 'your playlist')
  queueIsOpen = !queueIsOpen
  removeActive()
  document.querySelector('#search').classList.add('active')
}
function toLiked() {
  lastState.push(toLiked)
  document.querySelector('.mainContent').style.display = 'none'
  document.querySelector('#musics').style.display = 'none'
  document.querySelector('.searche').style.display = 'none'
  document.querySelector('.library').style.display = 'none'
  document.querySelector('.liked').style.display = 'initial'
  queueIsOpen = !queueIsOpen
  removeActive()
  document.querySelector('#likeTab').classList.add('active')
}
function toLibrary() {
  lastState.push(toLibrary)
  document.querySelector('.mainContent').style.display = 'none'
  document.querySelector('#musics').style.display = 'none'
  document.querySelector('.searche').style.display = 'none'
  document.querySelector('.liked').style.display = 'none'
  document.querySelector('.library').style.display = 'initial'
  openMusic(queue, 'your playlist')
  queueIsOpen = !queueIsOpen
  removeActive()
  document.querySelector('#likeTab').classList.add('active')

  var clutter = `<div class="container-fluid" onclick="openLiked()">
  <div class="row">
    <div class="col-12">
      <div class="flex-container">
        <div class="card flex-item rounded-2 overflow-hidden">
          <img
            src="/assets/like.png"
            alt="thumbnail"
            class="img-fluid card-img-top"
            style="pointer-events: none"
          />
          <div class="card-block">
            <h4 style="pointer-events: none" class="card-title mt-3"
              >Liked Songs</h4
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`
  user.playlists.forEach((playlist) => {
    clutter += `<div class="container-fluid" onclick="openPlaylist('${playlist._id}')">
    <div class="row">
      <div class="col-12">
        <div class="flex-container">
          <div class="card flex-item rounded-2 overflow-hidden">
            <img
              src="/assets/music.png"
              alt="thumbnail"
              class="img-fluid card-img-top"
              style="pointer-events: none"
            />
            <div class="card-block">
              <h4 style="pointer-events: none" class="card-title mt-3"
                >${playlist.title}</h4
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
 `
  })
  clutter += `<div
  class="container-fluid"
  type="button"
  data-bs-toggle="modal"
  data-bs-target="#exampleModalCenter"
>
  <div class="row">
    <div class="col-12">
      <div class="flex-container">
        <div class="card flex-item">
          <img src="/assets/add.png" />
          <div class="card-block">
            <h4 style="pointer-events: none" class="card-title mt-3"
              >Create new playList</h4
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`
  document.querySelector('.books').innerHTML = clutter
}
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${parseInt(remainingSeconds) < 10 ? '0' : ''}${parseInt(
    remainingSeconds,
  )}`
}
function shuffle() {
  document.querySelector('#shuffle i').classList.toggle('text-success')
}
function loop() {
  document.querySelector('#loop i').classList.toggle('text-success')
}
function playNext() {
  if (document.querySelector('#loop i').classList.contains('text-success')) {
    song.currentTime = 0
    return
  }
  var inde = 0
  queue.forEach((son, index) => {
    if (
      song.getAttribute('src').split('/')[
        song.getAttribute('src').split('/').length - 1
      ] == son.name
    ) {
      inde = ++index
    }
  })
  if (document.querySelector('#shuffle i').classList.contains('text-success')) {
    inde = Math.floor(Math.random() * queue.length)
  }
  if (inde == myLibrary.length) {
    inde = 0
  }
  play(
    queue[inde].name,
    queue[inde].poster,
    queue[inde].title,
    queue[inde].artist,
    queue[inde]._id,
  )
}
function playPrev() {
  if (document.querySelector('#loop i').classList.contains('text-success')) {
    song.currentTime = 0
    return
  }
  var inde = 0
  queue.forEach((son, index) => {
    if (
      song.getAttribute('src').split('/')[
        song.getAttribute('src').split('/').length - 1
      ] == son.name
    ) {
      inde = --index
    }
  })
  if (document.querySelector('#shuffle i').classList.contains('text-success')) {
    inde = Math.floor(Math.random() * queue.length)
  }
  if (inde == -1) {
    inde = myLibrary.length - 1
  }
  play(
    queue[inde].name,
    queue[inde].poster,
    queue[inde].title,
    queue[inde].artist,
    queue[inde]._id,
  )
}
function playSon() {
  document
    .querySelector('.buttons #playSong i')
    .classList.remove('ri-play-circle-fill')
  document
    .querySelector('.buttons #playSong i')
    .classList.add('ri-pause-circle-fill')
  document.querySelector('.buttons #playSong i').style.display = 'initial'
  song.play()
  if (fromCurrentDevice) socket.emit('play', { userId: user._id })
}
function pause() {
  document
    .querySelector('.buttons #playSong i')
    .classList.add('ri-play-circle-fill')
  document
    .querySelector('.buttons #playSong i')
    .classList.remove('ri-pause-circle-fill')
  song.pause()
  if (fromCurrentDevice) socket.emit('pause', { userId: user._id })
}
function playPause() {
  if (!isPlaying) {
    playSon()
  } else {
    pause()
  }
  isPlaying = !isPlaying
}
function mutedUnmuted() {
  var volumeIcon =
    document.querySelector('.ri-volume-up-fill') ||
    document.querySelector('.ri-volume-mute-fill')

  if (!isMuted) {
    song.volume = 0
    document.querySelector('#volume').value = 0
    volumeIcon.classList.remove('ri-volume-up-fill')
    volumeIcon.classList.add('ri-volume-mute-fill')
  } else {
    song.volume = 0.6
    document.querySelector('#volume').value = 60
    volumeIcon.classList.add('ri-volume-up-fill')
    volumeIcon.classList.remove('ri-volume-mute-fill')
  }
  isMuted = !isMuted
}

function openMusic(musics, heading) {
  if (musics.length > 0) {
    document
      .querySelector('#breadImage')
      .setAttribute('src', `/image/${musics[0].poster}`)
  }
  var clutter = ''
  musics.forEach((musi, index) => {
    clutter += `<div
    onclick="play( '${musi.name}', '${musi.poster}','${musi.title.replace(
      /'/g,
      '"',
    )}','${musi.artist.replace(/'/g, '"')}','${musi._id}')"
     class="mus d-flex justify-content-between align-items-center">
        <div class="detail d-flex gap-3">
          <img src="/image/${musi.poster}" alt="poster" />
          <div class="text">
            <p class="fw-medium p-0 m-0"> ${musi.title}</p>
            <small class="fw-medium p-0 m-0 opacity-75"
              > ${musi.artist}</small
            >
          </div>
        </div>
        <div
          
          class="playButton btn border-0 d-flex align-items-center justify-content-center"
        >
          <i class="ri-play-circle-fill"></i>
          <i class="ri-pause-circle-fill"></i>
        </div>
      </div> `
  })
  document.querySelector('.moreMusics').innerHTML = clutter
  document.querySelector('.musicHeading ').textContent = heading
}
function removeActive() {
  document.querySelectorAll('.mainNavigation ul li').forEach((li) => {
    li.classList.remove('active')
  })
}
setInterval(() => {
  if (isPlaying) {
    songProgress.value = song.currentTime
    document.querySelector('#end').textContent =
      parseInt(song.duration) == NaN
        ? '00:00'
        : formatTime(Math.floor(song.duration - 1.5))
    document.querySelector('#start').textContent = formatTime(song.currentTime)
    songProgress.max = Math.floor(song.duration - 1.5)
    if (Math.floor(song.currentTime) >= Math.floor(song.duration - 1.5)) {
      playNext()
    }
  }
}, 1000)
song.addEventListener('ended', (event) => {
  // playNext()
})
window.addEventListener('keydown', (event) => {
  if (event.key == ' ') {
    if (document.activeElement == document.querySelector('body')) {
      event.preventDefault()
      playPause()
    }
  } else if (event.keyCode == '37') {
    event.preventDefault()
    playPrev()
  } else if (event.keyCode == '39') {
    event.preventDefault()
    playNext()
  } else if (event.keyCode == '38') {
    event.preventDefault()
    document.querySelector('#volume').value = Math.max(
      0,
      parseInt(document.querySelector('#volume').value) + 10,
    )
    song.volume = parseInt(document.querySelector('#volume').value) / 100
  } else if (event.keyCode == '40') {
    document.querySelector('#volume').value = Math.max(
      0,
      parseInt(document.querySelector('#volume').value) - 10,
    )
    song.volume = parseInt(document.querySelector('#volume').value) / 100
  }
})

document.querySelectorAll('.mainNavigation ul li').forEach((li) => {
  li.addEventListener('click', (eve) => {
    removeActive()
    li.classList.add('active')
  })
})
document.querySelector('#home').addEventListener('click', (event) => {
  toHome()
})
document.querySelector('#search').addEventListener('click', (event) => {
  openSearch()
})
document.querySelector('#toHome').addEventListener('click', (event) => {
  toHome()
})
document.querySelector('#likeTab').addEventListener('click', (event) => {
  openLiked()
})
document.querySelector('#playListTab').addEventListener('click', (event) => {
  openPlayListTab()
})
document.querySelector('#nextTrack').addEventListener('click', (event) => {
  playNext()
})
document.querySelector('.mobileNext').addEventListener('click', (event) => {
  playNext()
})
document.querySelector('#prevTrack').addEventListener('click', (event) => {
  playPrev()
})
document.querySelector('.mobilePrev').addEventListener('click', (event) => {
  playPrev()
})

document.querySelector('#volume').addEventListener('input', (event) => {
  song.volume = parseInt(document.querySelector('#volume').value) / 100
})

document.querySelector('#playSong').addEventListener('click', (event) => {
  playPause()
})
songProgress.addEventListener('change', (event) => {
  song.currentTime = songProgress.value
  socket.emit('changeCurrentTime', {
    userId: user._id,
    currentTime: songProgress.value,
  })
})

window.addEventListener('click', (event) => {
  if (event.target.parentElement.classList.contains('playButton')) {
    document.querySelectorAll('.playButton').forEach((ele) => {
      if (event.target.parentElement != ele) ele.classList.remove('playing')
    })
    if (event.target.parentElement.classList.contains('playing')) {
      event.target.parentElement.classList.remove('playing')
      pause()
    } else {
      playSon()
      event.target.parentElement.classList.add('playing')
    }
  } else {
    var isthereChild = false
    isthereChild = event.target.getElementsByClassName('playButton')
    if (isthereChild.length == 1) {
      isthereChild = isthereChild[0]

      document.querySelectorAll('.playButton').forEach((ele) => {
        if (isthereChild != ele) ele.classList.remove('playing')
      })
      try {
        if (isthereChild.classList.contains('playing')) {
          isthereChild.classList.remove('playing')
          pause()
        } else {
          playSon()
          isthereChild.classList.add('playing')
        }
      } catch (err) {}
    }
  }
})

document.querySelectorAll('.recommend').forEach((recommend) => {
  recommend.addEventListener('click', (event) => {})
})
