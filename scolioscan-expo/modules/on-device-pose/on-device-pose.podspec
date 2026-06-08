require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'on-device-pose'
  s.version        = package['version']
  s.summary        = package['description'] || package['name']
  s.description    = package['description'] || package['name']
  s.license        = package['license'] || 'MIT'
  s.author         = package['author'] || 'author'
  s.homepage       = package['homepage'] || 'https://github.com/expo/expo'
  s.platform       = :ios, '13.4'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Google ML Kit dependencies (Stable 8.0.0)
  s.dependency 'GoogleMLKit/PoseDetection', '8.0.0'
  s.dependency 'GoogleMLKit/FaceDetection', '8.0.0'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
  
  # Standard directory-based source file inclusion
  s.source_files = "ios/**/*.{h,m,mm,swift}"
end
