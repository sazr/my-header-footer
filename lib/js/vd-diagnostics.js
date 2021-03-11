window.onload = function () {
  var loadTime = window.performance.timing.domContentLoadedEventEnd-window.performance.timing.navigationStart; 
  console.log('vD Diagnostic: Page load time is '+ loadTime);
}