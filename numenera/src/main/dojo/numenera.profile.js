var profile = {
    packages : [
        "dojo",
        "dijit",
        "dojox",
        "primejunta"
    ],
    basePath : ".",
    action : "release",
    mini : true,
    optimize : "closure",
    layerOptimize : "closure",
    selectorEngine : "acme",
    localeList : "en",
    layers : {
        "dojo/dojo" : {
            include : [ "dojo/dojo", "dojo/_base/declare", "dojo/i18n", "dojo/domReady", "dojo/parser" ],
            boot : true,
            customBase : true
        },
        "primejunta/numenera" : {
            include : [ "primejunta/numenera/chargen/CharacterGenerator" ]
        }
    },
    staticHasFeatures : {
        "dojo-sync-loader" : 1,
        "dojo-xhr-factory" : 1,
        "dojo-test-sniff" : 0
    }
};