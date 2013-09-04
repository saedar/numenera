define([ "dojo/_base/declare",
         "dojo/_base/lang",
         "dojo/_base/array",
         "dojo/string",
         "./data/descriptors",
         "./data/types",
         "./data/foci" ],
function( declare,
          lang,
          array,
          string,
          descriptors,
          types,
          foci )
{
    return declare([], {
        TRAINED_STR : "Ⓣ ",
        SPECIALIZED_STR: "Ⓢ ",
        CHOOSE_STR : "-- choose --",
        manager : {},
        constructor : function( kwObj )
        {
            lang.mixin( this, kwObj );
        },
        validateCharacter : function( silent )
        {
            var errs = [];
            if( !this.manager.getType() || !this.manager.getDescriptor() || !this.manager.getFocus() )
            {
                errs.push( "Please select a descriptor, type, and focus." );
            }
            if( this.manager.free_pool.value != "0" || this.manager.free_edge.value != "0" )
            {
                errs.push( "Please assign all of your character points." );
            }
            this.analyzeCharacter();
            var _sl = this._cdata.special_list;
            var _al = this._cdata.ability_list;
            var _el = this._cdata.equipment_list;
            // Look for missing choices.
            if( _sl.join( "," ).indexOf( this.CHOOSE_STR ) != -1 )
            {
                errs.push( "Please make all your special ability choices." );
            }
            if( _al.join( "," ).indexOf( this.CHOOSE_STR ) != -1 )
            {
                errs.push( "Please make all your skill choices." );
            }
            if( _el.join( "," ).indexOf( this.CHOOSE_STR ) != -1 )
            {
                errs.push( "Please make all equipment choices." );
            }
            if( array.indexOf( _al, this.TRAINED_STR + "Knowledge area:" ) != -1 || array.indexOf( _al, this.SPECIALIZED_STR + "Knowledge area:" ) != -1 )
            {
                errs.push( "Please choose your knowledge areas." );
            }
            if( array.indexOf(  _al, this.TRAINED_STR ) != -1 || array.indexOf( _al, this.SPECIALIZED_STR ) != -1 )
            {
                errs.push( "Please choose all your skills." );
            }
            // Look for duplicate perks.
            var _plist = [ "Ⓔ Reduce Armor Cost", "Ⓔ Recovery Roll +2", this.CHOOSE_STR ];
            for( var i = 1; i < _sl.length; i++ )
            {
                if( _sl[ i ] == _sl[ i - 1 ] && array.indexOf( _plist, _sl[ i ] ) == -1 )
                {
                    errs.push( "You cannot take the special ability " + _sl[ i ] + " twice." );
                }
            }
            // Enforce combat skill specialization limit.
            if( this._cdata.character_type != "glaive" || this._cdata.character_tier < 5 )
            {
                var _cats = [ "Light", "Medium", "Heavy" ];
                var _types = [ "Bashing", "Bladed", "Ranged" ];
                for( var i = 0; i < _cats.length; i++ )
                {
                    for( var j = 0; j < _types.length; j++ )
                    {
                        if( array.indexOf( _al, this.SPECIALIZED_STR + _cats[ i ] + " " + _types[ j ] ) != -1 )
                        {
                            errs.push( "You cannot specialize in " + _cats[ i ] + " " + _types[ j ] + " at your tier." );
                        }
                    }
                }
            }
            if( errs.length == 0 )
            {
                return true;
            }
            else
            {
                this.manager.tell( errs.join( "<br/><br/>" ) );
                return false;
            }
        },
        analyzeCharacter : function()
        {
            this._cdata = {};
            this._sv( "character_name", "characterNameInput" );
            this._sv( "character_descriptor", "descriptorSelect", 1 );
            this._sv( "character_type", "typeSelect", 1 );
            this._sv( "character_focus", "focusSelect", 1 );
            this._ss( "character_tier", "character_tier" );
            this._ss( "character_effort", "character_effort" );
            this._ss( "might_pool", "might_pool" );
            this._ss( "might_edge", "might_edge" );
            this._ss( "speed_pool", "speed_pool" );
            this._ss( "speed_edge", "speed_edge" );
            this._ss( "intellect_pool", "intellect_pool" );
            this._ss( "intellect_edge", "intellect_edge" );
            this._ss( "recovery_roll", "recovery_roll" );
            this._ss( "cypher_count", "cypher_count" );
            this._ss( "shin_count", "shin_count" );
            this._ss( "character_xp", "character_xp" );
            this._st( "description_text", this._textAsList( "description_text" ) );
            this._wl( "ability_list", this._getSkillList() );
            this._wl( "special_list", this._listAsText( "special_list") );
            this._wl( "cypher_list", this._listAsText( "cypher_list") );
            this._wl( "equipment_list", this._listAsText( "equipment_list" ).concat( this._textAsList( "extra_equipment_text") ) );
            this._wl( "notes_list", this._textAsList( "notes_text" ).concat( this._listAsText( "connection_list" ) ) );
            this._wl( "attack_data", this._getAttacks() );
            this._processSpecialAbilities();
            this._processArmorValues();
            this._wl( "attack_list", this._getAttackList() );
            return this._cdata;
        },
        _processSpecialAbilities : function()
        {
            var eq = this._cdata.special_list;
            var sl = this._cdata.ability_list;

            // attacks
            // collect boosts by type, category, short_name
            var boosts = {
                "light_bashing" : 0,
                "light_bladed" : 0,
                "light_ranged" : 0,
                "medium_bashing" : 0,
                "medium_bladed" : 0,
                "medium_ranged" : 0,
                "heavy_bashing" : 0,
                "heavy_bladed" : 0,
                "heavy_ranged" : 0,
                "damage" : 0,
                "light" : 1,
                "medium" : 0,
                "heavy" : 0,
                "chosen_weapon" : 0
            };
            // weapon mastery; since it includes a character input we have to find it this way
            for( var i = 0; i < eq.length; i++ )
            {
                var wms = "Ⓔ Weapon Master:";
                if( eq[ i ].indexOf( wms ) != -1 )
                {
                    this._cdata.chosen_weapon = string.trim( eq[ i ].substring( wms.length ) );
                    boosts.chosen_weapon = 1;
                }
            }
            if( this._has( "Ⓔ Damage Dealer" ) )
            {
                boosts.chosen_weapon = 3;
            }
            if( this._has( "Ⓔ Capable Warrior" ) )
            {
                boosts.damage = 1;
            }
            // enablers
            if( this._has( "Ⓔ Practiced With All Weapons" ) )
            {
                boosts = lang.mixin( boosts, {
                    light : 2,
                    medium : 1,
                    heavy : 1
                });
            }
            else if( this._has( "Ⓔ Practiced With Light/Medium Weapons" ) )
            {
                boosts = lang.mixin( boosts, {
                    light : 2,
                    medium : 1
                })
            }
            // training
            var cats = [ "heavy", "medium", "light" ];
            var types = [ "bashing", "bladed", "ranged" ];
            for( var i = 0; i < cats.length; i++ )
            {
                for( var j = 0; j < types.length; j++ )
                {
                    var boost = cats[ i ] + "_" + types[ j ];
                    var skill = cats[ i ].charAt( 0 ).toUpperCase() + cats[ i ].substring( 1 ) + " " + types[ j ].charAt( 0 ).toUpperCase() + types[ j ].substring( 1 );
                    if( array.indexOf( sl, this.SPECIALIZED_STR + skill ) != -1 )
                    {
                        boosts[ boost ] += 2;
                    }
                    else if( array.indexOf( sl, this.TRAINED_STR + skill ) != -1 )
                    {
                        boosts[ boost ] += 1;
                    }
                }
            }
            for( var i = 0; i < this._cdata.attack_data.length; i++ )
            {
                var cur = this._cdata.attack_data[ i ];
                // chosen weapon
                if( cur.short_name == this._cdata.chosen_weapon )
                {
                    cur.damage += boosts.chosen_weapon;
                }
                // general damage bonus
                cur.damage += boosts.damage;
                // category
                cur.difficulty_adjustment -= boosts[ cur.category ];
                // type
                cur.difficulty_adjustment -= boosts[ cur.category + "_" + cur.type ];
            }
        },
        _textAsList : function( textArea )
        {
            var dt = this.manager[ textArea ].get( "value" );
            dt = dt.split( "\n" );
            return dt;
        },
        _getSkillList : function()
        {
            var list = this._listAsText( "ability_list" );
            list.sort();
            if( list.length < 2 )
            {
                return list;
            }
            var out = [];
            out.push( list[ 0 ] );
            for( var i = 1; i < list.length; i++ )
            {
                if( list[ i ].toLowerCase() == list[ i - 1 ].toLowerCase() && list[ i ].indexOf( this.TRAINED_STR ) != -1 )
                {
                    var cur = out[ out.length - 1 ];
                    out[ out.length - 1 ] = this.SPECIALIZED_STR + cur.substring( cur.indexOf( this.TRAINED_STR ) + this.TRAINED_STR.length );
                }
                else
                {
                    out.push( list[ i ] );
                }
            }
            out.sort();
            return out;
        },
        _getAttacks : function()
        {
            var eq = this._listAsText( "equipment_list" );
            var out = [];
            var wpns = [];
            var idstr = "Weapon:";
            for( var i = 0; i < eq.length; i++ )
            {
                if( eq[ i ].indexOf( "Weapon:" ) != -1 )
                {
                    wpns.push( eq[ i ] );
                }
            }
            for( var i = 0; i < wpns.length; i++ )
            {
                var wpn = {
                    description : wpns[ i ],
                    short_name : string.trim( wpns[ i ].substring( wpns[ i ].indexOf( idstr ) + idstr.length + 1 ) ),
                    damage : 0,
                    category : "",
                    type : "",
                    difficulty_adjustment : 1
                }
                var dmg = 0;
                var diff = 1;
                var type = "";
                if( wpns[ i ].indexOf( "Light" ) != -1 )
                {
                    wpn.damage = 2;
                    wpn.difficulty_adjustment = 0;
                    wpn.category = "light";
                }
                else if( wpns[ i ].indexOf( "Medium" ) != -1  )
                {
                    wpn.damage = 4;
                    wpn.category = "medium";
                }
                else if( wpns[ i ].indexOf( "Heavy" ) != -1  )
                {
                    wpn.damage = 6;
                    wpn.category = "heavy";
                }
                if( wpns[ i ].indexOf( "Bashing" ) != -1 )
                {
                    wpn.type = "bashing";
                }
                else if( wpns[ i ].indexOf( "Bladed" ) != -1 )
                {
                    wpn.type = "bladed";
                }
                else if( wpns[ i ].indexOf( "Ranged" ) != -1 )
                {
                    wpn.type = "ranged";
                }
                out.push( wpn );
            }
            return out;
        },
        _getAttackList : function()
        {
            var out = [];
            for( var i = 0; i < this._cdata.attack_data.length; i++ )
            {
                var cur = this._cdata.attack_data[ i ];
                var pf = "";
                switch( cur.category )
                {
                    case "light" :
                        pf = "Ⓛ";
                        break;
                    case "medium" : 
                        pf = "Ⓜ";
                        break;
                    case "heavy" : 
                        pf = "Ⓗ";
                        break;
                }
                switch( cur.type )
                {
                    case "bashing" :
                        pf += "Ⓑ";
                        break;
                    case "bladed" : 
                        pf += "Ⓒ";
                        break;
                    case "ranged" : 
                        pf += "Ⓡ";
                        break;
                }
                out.push( pf + " " + cur.short_name + " (" + cur.difficulty_adjustment + "/" + cur.damage + ")" );
            }
            return out.sort();
        },
        _processArmorValues : function()
        {
            var aBase = parseInt( this._gf( "armor_bonus" ) );
            var pBase = 0;
            var _sl = this._cdata.special_list;
            for( var i = 0; i < _sl.length; i++ )
            {
                if( _sl[ i ] == "Ⓔ Reduce Armor Cost" )
                {
                    pBase--;
                }
            }
            if( this._has( "Ⓔ Ward" ) )
            {
                aBase += 1;
            }
            if( this._has( "Ⓔ Experienced Defender" ) )
            {
                aBase += 1;
            }
            if( this._has( "Ⓔ Practiced in Armor" ) )
            {
                pBase -= 2;
            }
            if( this._has( "Ⓔ Armor Expert" ) )
            {
                pBase -= 1;
            }
            if( this._has( "Ⓔ Experienced With Armor" ) )
            {
                pBase -= 1;
            }
            if( this._has( "Ⓔ Armor Master" ) || this._has( "Ⓔ Mastery With Armor" ) )
            {
                pBase = -999;
            }
            this._cdata.armor_value_none = aBase;
            this._cdata.armor_value_light = aBase + 1;
            this._cdata.armor_value_medium = aBase + 2;
            this._cdata.armor_value_heavy = aBase + 3;
            this._cdata.armor_speed_cost_heavy = pBase + 5 > 0 ? pBase + 5 : 0;
            this._cdata.armor_might_cost_heavy = pBase + 3 > 0 ? pBase + 3 : 0;
            this._cdata.armor_speed_cost_medium = pBase + 3 > 0 ? pBase + 3 : 0;
            this._cdata.armor_might_cost_medium = pBase + 2 > 0 ? pBase + 2 : 0;
            this._cdata.armor_speed_cost_light = pBase + 2 > 0 ? pBase + 2 : 0;
            this._cdata.armor_might_cost_light = pBase + 1 > 0 ? pBase + 1 : 0;
        },
        _has : function( feat )
        {
            var sl = this._cdata.special_list;
            if( array.indexOf( sl, feat ) != -1 )
            {
                return true;
            }
            else
            {
                return false;
            }
        },
        _listAsText : function( list )
        {
            return this.manager.listAsText( list );
        },
        _wl : function( to, list )
        {
            this._cdata[ to ] = lang.clone( list );
        },
        _gf : function( fld )
        {
            if( !this.manager[ fld ] )
            {
                return false;
            }
            return this.manager[ fld ].value;
        },
        _gs : function( sel )
        {
            return this.manager._selVal( this.manager[ sel ] ).label;
        },
        _sv : function( to, from, sel )
        {
            this._cdata[ to ] = sel ? this._gs( from ) : this._gf( from );
        },
        _ss : function( to, from )
        {
            var val = parseInt( this._gf( from ) );
            this._cdata[ to ] = isNaN( val ) ? 0 : val;
        },
        _st : function( to, val )
        {
            this._cdata[ to ] = val;
        }
    });
});