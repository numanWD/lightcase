# OverBox.js

Overbox.js is a lightweight overlay for images, Videos, Iframes, Inline content... 

> It is simple, clean and customisable.
 
Load the js, import our sass and define your style.

You can customise the plugin without touch the library.

Sass variables:

```sass
$overbox-default: (
     'breakpoint' : em(640),
     'icons-path' : '../images/overbox/',
     'overlay-background' : #333,
     'mobile-navigation-background' : rgba(0,0,0,0.3),
     'title-color' : #fff,
     'caption-color' : #fff,
     'sequence-info-color' : #fff,
     'title-font-size': 1.3em,
     'caption-font-size': 1em,
     'sequence-info-font-size': 1em,
     'icon-size' : 1.4em
);
 
```
 
To personalize your plugin you must define your map and load the library.


```sass
$overbox-custom: (
    'breakpoint' : em(720),
    'icons-path' : '../img/',
    'overlay-background' : #CCC
);
//Load overbox
@import "../bower_components/overbox/src/sass/overbox";
```

### Installation

```sh
bower install overbox -S
```