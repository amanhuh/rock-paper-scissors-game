window.addEventListener("load", () => {
  function playModal(user) {
    if (user) {
      const modalDiv = `<div id="playModal" class="fixed top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-modal md:h-full">
        <div class="relative w-full h-full max-w-2xl md:h-auto">
          <div class="relative bg-white rounded-lg shadow">
            <div class="p-6 space-y-6">
              <button class="bg-yellow-300 text-sm font-main text-white">CREATE A ROOM</button>
            </div>
          </div>
        </div>
      </div>`
    
      $('body').append(modalDiv)
    } else {
      window.location.href = "/login";
    }
  }
});