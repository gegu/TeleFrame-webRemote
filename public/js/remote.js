(async () => {

  const configObjects = await fetch(`/tfconfig/${location.search.substr(1).split(/[&=]/).join('/')}`).then(response => response.json());
  const config = configObjects.config;
  const screen = configObjects.screen;

  const status = {
    image: {},
    fadeTime: 0,
    imagesCount: 0,
    unseenCount: false,
    unseenCount: 0,
    isPaused: false,
    isMuted: false,
    screenOn: true,
    newImageNotify: false
  };

  var fetchTimeout;
  var captionSenderTimeout;
  var $container = $('#container');

  // configure sound notification sound
  if (config.playSoundOnRecieve !== false) {
    var audio = new Audio(`/sounds/${config.playSoundOnRecieve}`);
  }

  // append host o the page title
  $('title').text(`${$('title').text()} | ${location.host}`);

  // full screen toogle callback function
  const toggleFullScreen = () => screenfull.toggle($('body')[0]);

  const tfScreenToggle = () => {
    //const message = (status.screenOn ? );
    fetch('/command/tfScreenToggle').then(() => updateStatus());
    Swal.fire({
      title: config.addonInterface.addons.webRemote.phrases[status.screenOn ? 'switchScreenOff' : 'switchScreenOn'],
      showConfirmButton: false,
      timer: 5000,
      icon: "success"
    });
  };

  const touchBarElements = {
    showNewest: new TouchBarElement('fas fa-history', () => fetch('/command/newest').then(updateStatus)),
    previousImage: new TouchBarElement('far fa-arrow-alt-circle-left', () => fetch('/command/previous').then(updateStatus)),
    playPause: new TouchBarElement('far fa-pause-circle', () => fetch('/command/playPause').then(updateStatus)),
    nextImage: new TouchBarElement('far fa-arrow-alt-circle-right', () => fetch('/command/next').then(updateStatus)),
    starImage: new TouchBarElement('far fa-star', () => fetch('/command/star').then(updateStatus)),
    deleteImage: new TouchBarElement('far fa-trash-alt', deleteImage),
    mute: new TouchBarElement('fas fa-volume-up', () => fetch('/command/mute').then(updateStatus)),
    shutdown: new TouchBarElement('fas fa-power-off', shutdown),
    reboot: new TouchBarElement('fas fa-redo-alt', reboot),
    tfScreenToggle: new TouchBarElement('far fa-sun', tfScreenToggle),
    upload: new TouchBarElement('fas fa-upload', upload),
    fullscreen:  new TouchBarElement('fas fa-expand-arrows-alt', toggleFullScreen)
  }

  if (!screen.cmdBacklightOn || !screen.cmdBacklightOff) {
    delete touchBarElements.tfScreenToggle;
  }

  const availableTouchBarElemKeys = Object.keys(touchBarElements);

  let useTouchBarElemKeys = config.addonInterface.addons.webRemote.touchBarElements;
  if (Array.isArray(useTouchBarElemKeys) && useTouchBarElemKeys.length > 0) {
    useTouchBarElemKeys = useTouchBarElemKeys.filter(e => availableTouchBarElemKeys.indexOf(e) > -1);;
  } else {
    // use elements from TeleFrame config.touchBar
    useTouchBarElemKeys = config.touchBar.elements.filter(e => availableTouchBarElemKeys.indexOf(e) > -1);
    useTouchBarElemKeys.push('tfScreenToggle', 'upload', 'fullscreen');
  }


  const touchBar = new TouchBar(touchBarElements, {
    height: config.touchBar.height,
    // timout to automatically hide the touchbar.
    autoHideTimeout: 30 * 1000,
    // Defines an objectspecifying the touchbar icons to enable
    elements: useTouchBarElemKeys
  });

  $('.touch-container').off('touchend click').on('click', function(e) {
  	e.preventDefault();
	e.stopPropagation();
  console.log('.touch-container clicked');
  	touchBar.toggle();
  });
  $('.' + useTouchBarElemKeys.join(' ,.')).on('click', function(e) {
    e.stopPropagation();
  //  e.preventDefault();
    $(this).trigger('touchend');
  })

  // dynamic touchbar height and element size using css
  $('.touch-bar-container, .touchBarElement').css({
    height: '',
    bottom: '',
    'font-size': '',
    'line-height': ''
  })

  const smallTouchHeight = 35;
  const touchHeight = Math.max(smallTouchHeight, Math.min(75, config.touchBar.height.replace(/(px)|(vh)/g, '')));
  const smallIconsMaxWidth =parseInt($('.touch-bar > .touchBarElement').length * touchHeight);
  $('head').append(
`<style id="touchBarHeight">
  .touch-bar-container {
    height: ${touchHeight}px;
    bottom: -${touchHeight}px;
  }
  .touchBarElement {
    height: ${touchHeight}px;
    font-size: calc(${touchHeight}px * 0.8);
    line-height: ${touchHeight}px;
  }

  @media screen and (max-width: ${smallIconsMaxWidth}px) {
    .touch-bar-container {
      height: ${smallTouchHeight}px;
      bottom: -${smallTouchHeight}px;
    }
    .touchBarElement {
      height: ${smallTouchHeight}px;
      font-size: calc(${smallTouchHeight}px * 0.8);
      line-height: ${smallTouchHeight}px;
    }
  }
</style>`);

  // initialize fullscreen handling
  if (screenfull.isEnabled) {
    screenfull.on('change', () => {
      if (screenfull.isFullscreen) {
        $('.fullscreen > i').removeClass('fa-expand-arrows-alt').addClass('fa-compress-arrows-alt');
      } else {
        $('.fullscreen > i').removeClass('fa-compress-arrows-alt').addClass('fa-expand-arrows-alt');
      }
  	});
    $('body').on('dblclick', toggleFullScreen);
  } else {
    console.warn('screenfull disabled');
    $('.fullscreen').remove();
  }

  // initialize swipe and zoom handling
  if (Hammer) {
    new Hammer.Manager(document.getElementById('touch-container'), {
      recognizers: [
        [Hammer.Swipe, { direction: Hammer.DIRECTION_HORIZONTAL }],
        [Hammer.Pinch]
      ]
    })
    // Subscribe to the desired events
    .on('swipe pinch', function(event) {
      switch(event.type) {
        case 'swipe':
          $('.imgcontainer').animate({ left: (event.offsetDirection === Hammer.DIRECTION_LEFT ? '-=' : '+=') + '100%'}, 50,
            () => $(event.offsetDirection === Hammer.DIRECTION_LEFT ? '.nextImage' : '.previousImage').trigger('click')
          );
          //$(event.offsetDirection === Hammer.DIRECTION_LEFT ? '.nextImage' : '.previousImage').trigger('click');
          break;
        case 'pinch':
          if (event.scale) {
            const MAX_SCALE_FACTOR = 5;
            const ZOOM_FACTOR = 1;
            const $assetContainer = $container.find('.imgcontainer');
            if ($assetContainer.length > 0) {
              let attrib = 'height';
              // get the current zomm (starts with '100%')
              let currentZoom = $assetContainer[0].style.width;
              if (currentZoom) {
                attrib = 'width';
              } else {
                currentZoom = $assetContainer[0].style.height;
              }
              currentZoom = parseInt(currentZoom.replace('%', '')) || 100;
              $assetContainer.css(`max-${attrib}`, '');
              $assetContainer[attrib](Math.min((100 * MAX_SCALE_FACTOR), Math.max((100 / MAX_SCALE_FACTOR), currentZoom + (event.scale > 1.0 ? ZOOM_FACTOR : -ZOOM_FACTOR))) + '%');
            }
          }
          break;
      }
    });
  } else {
    console.warn(`Touch gestures not available! Update your installation of TeleFrame-webRemote using 'npm install'`);
  }

  function upload() {
    const  UploadError = {
      INVALID_FILE_SIZE: 1
    };
    const MAX_UPLOAD_SIZE = 1024*1024*20;
    let sender = 'Web remote';
    if (localStorage) {
        sender = (localStorage.getItem('sender') || 'Web remote').replace(/"/g, '');
    }

    fetch('/upload/fileTypes')
    .then(response => response.json())
    .then(supportedUploadFileTypes => Swal.fire({
        title: config.addonInterface.addons.webRemote.phrases.uploadDlgTitle,
        showCancelButton: true,
        html:
`<label for="sender">${config.addonInterface.addons.webRemote.phrases.uploadSender}</label>
<input id="sender" class="swal2-input" type="text" maxlength="50" value="${sender}">
<input id="asset" class="swal2-input" type="file" multiple accept: .${supportedUploadFileTypes.join(',.')}>
<label for="caption">${config.addonInterface.addons.webRemote.phrases.uploadCaption}</label>
<input id="caption" class="swal2-input" type="text" maxlength="500">`,
        allowOutsideClick: false,
        focusConfirm: false,
        preConfirm: () => {
          const sender = $('#sender').val().replace(/"/g, '');
          if (localStorage) {
            localStorage.setItem('sender', sender);
          }

          return {
            caption: $('#caption').val(),
            files: $('#asset')[0].files,
            sender: sender
          }
        }

      })
    )
    .then(({value: formValues}) => {
      if (formValues && formValues.files.length) {
        const formData = new FormData();
        formData.append('caption', formValues.caption);
        formData.append('sender', formValues.sender);

        for (let index of Object.keys(formValues.files)) {
          formData.append('asset', formValues.files[index]);
        }
        return formData;
      }
      // throw empty exception if no files selected to avoid error message output
      throw undefined;
    })
    .then(formData => fetch('/upload', {method: "POST", body: formData}))
    .then(_ => Swal.fire({
        title: 'Upload 👍',
        showConfirmButton: false,
        timer: 5000,
        icon: "success"
      })
    )
    .catch(error => {
      // error can be undefined
      if (error) {
        console.error('Upload error!', error);
        Swal.fire({
          title: 'Upload 🥺!',
          showConfirmButton: false,
          text: error,
          timer: 5000,
          icon: "error"
        })
      }
    });
  }

  function showOffline() {
    if (status.offline) {
      if ($('#offlineicon').length === 0 ) {
        $('body').append('<div id="offlineicon" class="status-icon"><i class="fas fa-exclamation"></i><div>Offline</div></div>');
      }
    } else {
      $('#offlineicon').remove();
    }
  }

  function showPause() {
    if ($('#pauseBox').length > 0)
    {
      $container.append($('#pauseBox').detach());
    } else {
      var $pauseBox = $('<div id="pauseBox"/>');
      $pauseBox.css({
        height :'50px',
        width: '45px',
        position: 'absolute',
        top: '20px',
        right: '20px'
      });

      var $divBar = $("<div/>");
      $divBar.css({
        height: '50px',
        'width': '15px',
        'background-color': 'blue',
        float: 'left',
        'border-radius': '2px'
      });

      $pauseBox.append($divBar, $divBar.clone().css({
        float: 'right',
        'border-radius': '2px'
      }));

      $container.append($pauseBox);
    }
  }

  function hidePause() {
    $("#pauseBox").remove();
  }

  async function deleteImage() {
    if (status.imagesCount === 0) {
      return;
    }
    await fetch('/command/delete').then(updateStatus);

    if (config.confirmDeleteImage === false) {
      return;
    }
    updateInterface({ isPaused: true });
    touchBar.hide();
    Swal.fire({
      title: config.phrases.deleteMessage,
      background: 'rgba(255,255,255,0.8)',
      confirmButtonText: config.phrases.deleteConfirmText,
      cancelButtonText: config.phrases.deleteCancelText,
      showCancelButton: true,
      focusCancel: true,
      confirmButtonColor: '#a00',
      icon: "warning"
    }).then(result => {
      if (result.value) {
        fetch('/command/askConfirm');
      } else {
        fetch('/command/askCancel');
      }
      touchBar.show();
    });
  }

  async function shutdown() {
    await fetch('/command/shutdown').then(updateStatus);

    if (config.confirmShutdown === false) {
      return;
    }
    touchBar.hide();
    Swal.fire({
      title: config.phrases.shutdownMessage,
      background: 'rgba(255,255,255,0.8)',
      confirmButtonText: config.phrases.shutdownConfirmText,
      cancelButtonText: config.phrases.shutdownCancelText,
      showCancelButton: true,
      focusCancel: true,
      confirmButtonColor: '#a00',
      icon: "warning"
    }).then(result => {
      if (result.value) {
        fetch('/command/askConfirm');
      } else {
        fetch('/command/askCancel');
      }
      touchBar.show();
    });
  }

  async function reboot() {
    await fetch('/command/reboot').then(updateStatus);

    if (config.confirmReboot === false) {
      return;
    }
    touchBar.hide();
    Swal.fire({
      title: config.phrases.rebootMessage,
      background: 'rgba(255,255,255,0.8)',
      confirmButtonText: config.phrases.rebootConfirmText,
      cancelButtonText: config.phrases.rebootCancelText,
      showCancelButton: true,
      focusCancel: true,
      confirmButtonColor: '#a00',
      icon: "warning"
    }).then(result => {
      if (result.value) {
        fetch('/command/askConfirm');
      } else {
        fetch('/command/askCancel');
      }
      touchBar.show();
    });
  }

  function setTouchbarIconStatus() {
    if (status.imagesCount > 0) {
      if (status.image.starred) {
        $('.starImage > i').removeClass('far').addClass('fas');
      } else {
        $('.starImage > i').removeClass('fas').addClass('far');
      }
      if (status.isPaused) {
        $('.playPause > i').removeClass('fa-play-circle').addClass('fa-pause-circle');
      } else {
        $('.playPause > i').removeClass('fa-pause-circle').addClass('fa-play-circle');
      }
      $('.record, .deleteImage, .starImage').find('i').removeClass('disabled-icon');
      if (status.unseenCount) {
        $('.showNewest > i').removeClass('fa-history fa-images').addClass('fa-image new-asset');
      } else {
        $('.showNewest > i').removeClass('fa-image fa-images new-asset').addClass('fa-history');
      }
    }
    if (status.imagesCount > 1) {
      $('.previousImage, .nextImage, .showNewest, .playPause').find('i').removeClass('disabled-icon');
      if (status.unseenCount > 1) {
        $('.showNewest > i').removeClass('fa-image').addClass('fa-images');
      }
    }
    if (status.imagesCount < 2) {
      $('.playPause, .previousImage, .nextImage').find('i').addClass('disabled-icon');
      $('.showNewest > i').removeClass('new-asset fa-image fa-images').addClass('fa-history disabled-icon')
      if (status.imagesCount == 0) {
        $('.record, .deleteImage, .starImage').find('i').addClass('disabled-icon');
      }
    }
    if (status.isMuted) {
      $('.mute > i').removeClass('fa-volume-up').addClass('fa-volume-mute');
    } else {
      $('.mute > i').removeClass('fa-volume-mute').addClass('fa-volume-up');
    }
    if (status.screenOn) {
      $('.tfScreenToggle > i').removeClass('fas fa-moon').addClass('far fa-sun');
    } else {
      $('.tfScreenToggle > i').removeClass('far fa-sun').addClass('fas fa-moon');
    }

  }

  /**
   * Create the caption and sender containers
   * @param  {Object} image    entry of images array
   */
  $.fn.createCaptionSender = function(image) {
    let $assetDiv = $(this);
    clearTimeout(captionSenderTimeout);
    if (config.showCaption || config.showSender) {
      var $sender = $('<span class="sender"/>');
      var $caption = $('<span class="caption"/>');

      //create background and font colors for sender and caption
      var backgroundColor = randomColor({
        luminosity: "dark",
        alpha: 1
      });
      var fontColor = randomColor({
        luminosity: "light",
        alpha: 1
      });
      //when contrast between background color and font color is too small to
      //make the text readable, recreate colors
      while (chroma.contrast(backgroundColor, fontColor) < 4.5) {
        backgroundColor = randomColor({
          luminosity: "dark",
          alpha: 1
        });
        fontColor = randomColor({
          luminosity: "light",
          alpha: 1
        });
      }

      $sender.html(image.sender);
      $caption.html(image.caption);
      $([$sender, $caption]).each(function() {
        $(this).css({
          backgroundColor: backgroundColor,
          color: fontColor
        });
      });

      //generate some randomness for positions of sender and caption
      if (Math.random() >= 0.5) {
        $sender.css({
          left: 0,
          'border-top-right-radius': "10px",
          'border-bottom-right-radius': "10px"
        });
      } else {
        $sender.css({
          right: 0,
          'border-top-left-radius': "10px",
          'border-bottom-left-radius': "10px"
        });
      }
      if (Math.random() >= 0.5) {
        $caption.css({
          left: 0,
          'border-top-right-radius': "10px",
          'border-bottom-right-radius': "10px"
        });
      } else {
        $caption.css({
          right: 0,
          'border-top-left-radius': "10px",
          'border-bottom-left-radius': "10px"
        });
      }
      if (Math.random() >= 0.5) {
        $sender.css('top', "2%");
        $caption.css('bottom', "2%");
      } else {
        $sender.css('bottom', "2%");
        $caption.css('top', "2%");
      }
      if (config.showSender) {
        $assetDiv.append($sender);
      }
      if (config.showCaption && image.caption !== undefined) {
        $assetDiv.append($caption);
      }
      $('.sender, .caption').css('padding', '15px');
      //fade out sender and caption at half time of the shown image
      captionSenderTimeout = setTimeout(() => {
        $('.sender, .caption').each(function() {
          $(this).fadeOut({
            duration: config.fadeTime / 2,
            complete: function() { $(this).remove(); }
          });
        });
      }, config.interval * 0.01 * (Math.max(10, Math.min(100, parseInt(config.senderAndCaptionDuration) || 50))));
    }
  };

  //load image to slideshow
  function loadImage(image, fadeTime) {
    if (status.imagesCount == 0) {
      return;
    }

    setTouchbarIconStatus();

    //get current container and create needed elements
    var $currentImage = $container.children('div.basecontainer, div.imgcontainer, h1').first();

    // create asset container
    var $div = $('<div class="imgcontainer"/>');
    var $assetDiv = null;
    if (config.useFullscreenForCaptionAndSender) {
      // Create an additional container to display sender/caption on the full screen
      $assetDiv = $("<div/>");
      $assetDiv.addClass("basecontainer");
      $assetDiv.append($div);
      $assetDiv.css({
        display: 'none',
      });
      $div.css('display', 'block');
    } else {
      $assetDiv = $div;
    }
    $assetDiv.css({
      height: window.innerHeight + 'px',
      width: window.innerWidth + 'px',
    });

    // create asset container
    var $asset;
    if (image.src.split(".").pop() == "mp4") {
      $asset = $("<video/>");
      $asset.prop('muted',  !config.playVideoAudio);
      $asset.prop('autoplay', true);
    } else {
      $asset = $("<img/>");
    }
    $asset.attr('src', `/${image.src}`);
    $asset.addClass("image");

    $div.append($asset);

    $container.append($assetDiv);

    $asset.one(($asset.is('video') ? 'loadeddata' : 'load'), {currentAsset: $currentImage},
    function(event) {
      let $currentAsset = event.data.currentAsset;
      delete event.data.currentAsset;
      let $asset = $(this);
      let $assetDiv = $asset.parents('.basecontainer, .imgcontainer').last();
      const screenAspectRatio = $(window).width() / $(window).height();

      const assetAspectRatio = ($asset.is('video')
          ? $asset.videoWidth / $asset.videoHeight
          : $asset.naturalWidth / $asset.naturalHeight);

      //calculate aspect ratio to show complete image on the screen and
      //fade in new image while fading out the old image as soon as
      //the new image is loaded
      let css;
      if (assetAspectRatio > screenAspectRatio || screenAspectRatio < 1)  {
        css = {
          width: "100%",
          'max-width': "100%"
        };
      } else {
        css = {
          height: "100%",
          'max-height': "100%"
        };
      }

      $([$asset, $asset.closest('.imgcontainer')]).each( function(){
          $(this).css(css);
      });

      $assetDiv.createCaptionSender(image);

      if (fadeTime === 0) {
        $assetDiv.show();
        $currentAsset.remove();
        cleanUp(true);
      } else {
        $assetDiv.fadeIn({
          duration: fadeTime
        });
        $currentAsset.fadeOut({
          duration: fadeTime,
          complete: function() {
            $(this).remove();
            cleanUp(true);
          }
        });
      }
    });
  }

  const cleanUp = (cleanContainers) => {
    const cleanUpSelector = (config.useFullscreenForCaptionAndSender
     ? 'div.basecontainer'
     : 'div.imgcontainer') + ', h1';
    if (cleanContainers) {
      $container.children(cleanUpSelector).not(':last').remove();
    }
  }

  //notify user of incoming image and restart slideshow with the newest image
  const newImage = () => {
    setTouchbarIconStatus();
    if ((config.playSoundOnRecieve != false) && (status.isMuted == false)) {
      audio.play();
    }
    let message;
    if (status.image.src.slice(-4) !== '.mp4') {
      message = config.phrases.newPhotoMessage;
    } else {
      message = config.phrases.newVideoMessage;
    }
    Swal.fire({
      title: message
            + " " + status.image.sender,
      showConfirmButton: false,
      timer: 5000,
      icon: "success"
    });
  }

  const updateInterface = (newStatus) => {
    if (newStatus.image && newStatus.image.src !== status.image.src) {
      setTimeout(() => loadImage(newStatus.image, newStatus.fadeTime), 10)
    }
    if (newStatus.hasOwnProperty('isPaused') && newStatus.isPaused !== status.isPaused) {
      if (newStatus.isPaused) {
        showPause();
      } else {
        hidePause();
      }
    }
    Object.assign(status, newStatus);
    if (status.newImageNotify) {
      status.newImageNotify = false;
      newImage();
    }
    setTouchbarIconStatus();
  }

  const updateStatus = () => {
    clearTimeout(fetchTimeout);
    if (status.offline && $('#loading').length === 0) {
      $('#offlineicon').hide();
      $('body').append('<div id="loadicon" class="status-icon"><i class="fas fa-redo-alt"></i><div>Connecting...</div></div>')
    }
    fetch('/status')
    .then(response => response.json())
    .then(newStatus => {
      updateInterface(newStatus);
      fetchTimeout = setTimeout(updateStatus, config.addonInterface.addons.webRemote.statusUpdateInterval || 1000);
      status.offline = false;
    })
    .catch(_ => {
      status.offline = true
      fetchTimeout = setTimeout(updateStatus, config.addonInterface.addons.webRemote.statusUpdateIntervalOffline || 10000);
    })
    .finally(() =>{
      $('#loadicon').remove();
      $('#offlineicon').show();
      showOffline();
    });
  };

  $(window).on('resize', () => {
    if (window.innerWidth < window.innerHeight) {
      const newHeight = parseInt(window.innerWidth / 16 * 9);
      $container.width(window.innerWidth + 'px');
      $container.height(newHeight + 'px');
      $container.css('top', parseInt((window.innerHeight - newHeight) / 2) + 'px');
    } else {
      $container.width(window.innerWidth);
      $container.height(window.innerHeight);
      $container.css('top', '');
    }
    loadImage(status.image, 0);
  });

  updateStatus();
  $(window).trigger('resize');
  console.log('tf-remote ready :-)');
})();
