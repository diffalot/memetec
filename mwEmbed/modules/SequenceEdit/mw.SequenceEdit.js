/** 
 * Main Sequence Editor Driver
 */

mw.includeAllModuleMessages();

/*
* Setup the sequenceEdit jQuery binding:
*/
( function( $ ) {
	$.fn.sequenceEdit = function( options ) {
		// Debugger
		if( $j( this.selector ).length == 0 ){
			mw.log("SequenceEdit::Error missing target container");
			return; 
		}
		var seqContainer = $j( this.selector ).get(0);
		// Check if we already have a sequencer associated with this target
		if( seqContainer['sequenceEdit'] ){
			// xxx todo: pass on the options / action
			return ;
		}
		options['interfaceContainer'] = this.selector;
		
		// Issue a request to get the CSS file (if not already included):	
		mw.log( 'SequenceEdit:: create new SequenceEdit' );
		
		// Initialize the sequence object (it will take over from there)		
		seqContainer['sequenceEdit'] = new mw.SequenceEdit( options );

		// Draw the sequencer UI
		seqContainer['sequenceEdit'].drawUI();
		
		//Return the sequence jquery object
		return this;
		
	}
} )( jQuery );

//Wrap in mw closure to avoid global leakage
( function( mw ) {
	
/**
 * The set of valid sequenceEdit options
 */
var mw_sequenceedit_default_options = {
	'interfaceContainer' : null,
	'smilSource' : null,
	'videoAspect' : '4:3'
}
mw.SequenceEdit = function( options ) {
	return this.init( options );
};

// Set up the mvSequencer object
mw.SequenceEdit.prototype = {
	// lazy init id for the sequenceEdit instance. 
	id: null, 
	
	init: function( options ){
		if(!options){
			options = {};
		}
		//	Validate and set default options :
		for( var optionName in mw_sequenceedit_default_options ){
			if( typeof options[ optionName] != 'undefined'){
				this[optionName] =  options[ optionName] ;
			} else {
				this[optionName] = mw_sequenceedit_default_options[ optionName ]
			}
		}
		// For style properties assign top level mwe-sequence-edit class
		this.getContainer()
			.addClass('mwe-sequence-edit');
	},
	
	// Return the container id for the sequence
	getId: function(){
		if( !this.id ){
			// Assign the container an id if missing one::
			if( ! this.getContainer().attr('id') ){
				this.getContainer().attr('id', 'sequenceEdit_' + new Date().getTime() + Math.random() );
			}
			this.id = this.getContainer().attr('id');
		}
		return this.id;
	},
	/**
	 * @return smilSource url
	 */
	getSmilSource: function(){
		return this.smilSource;
	},
	
	/**
	 * Draw the initial sequence ui, uses ui.layout for adjustable layout  
	 */
	drawUI: function( ){
		var _this = this;
		mw.log("SequenceEdit:: drawUI to: " + this.interfaceContainer + 
				' ' + this.getContainer().length);
		
		// Add the ui layout
		this.getContainer().html(
			this.getUiLayout()
		)
		// Once the layout is in the dom setup resizableLayout "layout" options
		this.applyLayoutBindings();			
		
		// Add the smil player
		//xxx deal with the case of an empty player~~
		this.getPlayer().drawPlayer( function(){
			// Once the player and smil is loaded ::
			// start buffering
			_this.getEmbedPlayer().load();
			
			// Add the timeline
			_this.getTimeline().drawTimeline();	
			
		});		
		// Draw the top level menu
		this.getMenu().drawMenu();
		
	},
	getMenu: function(){
		if( !this.menu){
			this.menu = new mw.SequenceEditMenu( this ); 
		}
		return this.menu;
	},
	getPlayer: function(){
		if( ! this.player ){
			this.player = new mw.SequenceEditPlayer( this );
		}
		return this.player;
	},
	getRender: function(){
		if( !this.render ){
			this.render = new mw.SequenceEditRender( this );
		}
		return this.render;
	},
	getEmbedPlayer:function(){
		 return this.getPlayer().getEmbedPlayer();
	},
	getSmil: function(){
		if( !this.smil ){ 
			this.smil = this.getEmbedPlayer().smil;
		} 
		return this.smil;
	},
	getTimeline: function(){
		if( !this.timeline ){
			this.timeline = new mw.SequenceEditTimeline( this );			
		}
		return this.timeline;
	},
	getEditTools: function(){
		if( !this.editTools ){
			this.editTools = new mw.SequenceEditTools( this );
		}
		return this.editTools;
	},
	
	getKeyBindings:function(){
		if( ! this.keyBindings ){
			this.keyBindings = new mw.SequenceEditKeyBindings( this );
		}
		return this.keyBindings;
	},
	
	// Apply the re-sizable layout bindings and default sizes		
	applyLayoutBindings: function(){
		var _this = this;
		this.getContainer().find('.resizableLayout').layout({ 
			'applyDefaultStyles': true,
			/* player container */
			'east__minSize': 240,
			'east__size': 440,
			'east__onresize':function(){	
				_this.getPlayer().resizePlayer();
			},
			
			/* edit container */				
			'center__minSize' : 300,
			
			/* timeline container */
			'south__minSize' : 160,
			'south__size' : 150,
			'south__onresize' : function(){
				_this.getTimeline().resizeTimeline();
			}
		});
	},
	
	/**
	 * Get the UI layout
	 */
	getUiLayout: function(){
		// xxx There is probably a cleaner way to generate a list of jQuery objects than $j('new').children();
		return $j('<div />').append( 
		    $j('<div />')			
			.addClass( "mwseq-menu" )
			.css({
				'position':'absolute',
				'height': '25px',
				'width': '100%',
				'top': '0px',
				'left' : '0px',
				'background' : '#fff'
			})
			.text('Menu')
			,		
		
			$j('<div />')
			.addClass('resizableLayout')
			.css({
				'position':'absolute',								
				'top': '25px',
				'left': '0px',
				'right': '0px',
				'bottom':'0px'
			})
			.append( 			
				$j('<div />')
					.addClass( "ui-layout-center mwseq-edit" )
					.html( this.getEditTools().defaultText ),
				$j('<div />')
					.addClass( "ui-layout-east mwseq-player" )
					.text( gM('mwe-sequenceedit-loading_player') ),	
				$j('<div />')
					.addClass( "ui-layout-south mwseq-timeline" )
					.text( gM('mwe-sequenceedit-loading_timeline') )				
			)
		).children();
	},

	getMenuTarget: function(){
		return this.getContainer().find( '.mwseq-menu' );
	},
	getEditToolTarget: function(){
		return this.getContainer().find( '.mwseq-edit' );
	},
	getContainer: function(){
		return $j( this.interfaceContainer );
	}
	
}

} )( window.mw );	