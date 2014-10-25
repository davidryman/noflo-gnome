GladeConstructorComponent = require './GladeConstructorComponent'
Gio = imports.gi.Gio
Runtime = imports.runtime;

exports = (loader, done) ->
  manifest = Runtime.getApplicationManifest()
  unless manifest.ui
    do done
    return
  for ui in manifest.ui
    try
      path = Runtime.resolvePath('local://' + ui.file)
      file = Gio.File.new_for_uri path
      name = file.get_basename().replace(/\.glade$/, '').replace(/\.ui$/, '').replace(/[^a-zA-Z\/\-0-9_]/g, '')
      component = GladeConstructorComponent.getComponentForFile file, ui.additionals
      loader.registerComponent 'gtk-builder', name, component
    catch e
      log "Fail to load UI file: #{e.message}"
  do done if done
  return
