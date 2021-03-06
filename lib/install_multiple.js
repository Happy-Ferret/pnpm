var install = require('./install')

/*
 * Install multiple modules into `modules`.
 *
 *     ctx = { }
 *     installMultiple(ctx, ['minimatch@2'], 'chokidar@1.6.0', './node_modules')
 *     installMultiple(ctx, { minimatch: '^2.0.0' }, {chokidar: '^1.6.0'}, './node_modules')
 */

module.exports = function installMultiple (ctx, requiredPkgsMap, optionalPkgsMap, modules, options) {
  requiredPkgsMap = mapify(requiredPkgsMap)
  optionalPkgsMap = mapify(optionalPkgsMap)

  var optionalPkgs = Object.keys(optionalPkgsMap)
    .map(pkgName => pkgMeta(pkgName, optionalPkgsMap[pkgName], true))

  var requiredPkgs = Object.keys(requiredPkgsMap)
    .filter(pkgName => !optionalPkgsMap[pkgName])
    .map(pkgName => pkgMeta(pkgName, requiredPkgsMap[pkgName], false))

  return Promise.all(optionalPkgs.concat(requiredPkgs).map(function (pkg) {
    return install(ctx, pkg.fullName, modules, options)
      .catch(err => {
        if (pkg.optional) {
          console.log('Skipping failed optional dependency ' + pkg.fullName + ':')
          console.log(err.message || err)
          return
        }
        throw err
      })
  }))
}

function mapify (pkgs) {
  if (!pkgs) return {}
  if (Array.isArray(pkgs)) {
    return pkgs.reduce((pkgsMap, pkgFullName) => {
      var matches = /(@?[^@]+)@(.*)/.exec(pkgFullName)
      if (!matches) {
        pkgsMap[pkgFullName] = null
      } else {
        pkgsMap[matches[1]] = matches[2]
      }
      return pkgsMap
    }, {})
  }
  return pkgs
}

function pkgMeta (name, version, optional) {
  return {
    fullName: version ? '' + name + '@' + version : name,
    optional: optional
  }
}
