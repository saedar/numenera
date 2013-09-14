define([ "dojo/_base/declare",
         "dojo/_base/lang",
         "./_MutationControlBase",
         "dijit/_TemplatedMixin",
         "dijit/_WidgetsInTemplateMixin",
         "dojo/text!./templates/_DistinctiveMutationControl.html" ],
function( declare,
          lang,
          _MutationControlBase,
          _TemplatedMixin,
          _WidgetsInTemplateMixin,
          template )
{
    return declare([ _MutationControlBase, _TemplatedMixin, _WidgetsInTemplateMixin ], {
        type : "distinctive",
        templateString : template
    });
});