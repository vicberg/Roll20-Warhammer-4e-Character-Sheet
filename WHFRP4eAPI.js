var WHFP4E = WHFP4E || (function() {
    'use strict';

    let version = '1.00'
    let schemaVersion = 1.00
    let debug = true
    let name = ""
    let type
    let roll = 0
    let success = 0
    let location = ""
    let weapon = ""
    let range
    let damage = 0
    let target = 0
    let advantage = 0
    let talents = 0
    let output = ""
    let impale = false
    let critical = false
    let fumble = false
    let undamaging = false
    let damaging = false
    let impact = false
    let charging = false
    let infighting = false
    let tiring = false
    let toughness = 0
    let endurance = 0
    let strength = 0
    let cool = 0
    let agility = 0
    let dodge = 0
    let strengthBonus = 0
    let damageBonus = 0
    let characterObj
    let results = []
    let found = false
    let armor = 0
    let leatherAP = 0
    let mailAP = 0
    let plateAP = 0
    let shieldAP = 0
    let openHelm
    let fullHelm
    let band = ""
    let rangeModifier = 0
    let sizeModifier = 0
    let rangeToTarget = 0
    let modifier = 0
    let pummel = false
    let trapblade = false
    let fast = false
    let entangle = false
    let dangerous = false
    let blackpowder = false
    let penetrating = false
    let condition = false
    let impressive = false
    let repeater = false
    let reload = false
    let ammo
    let size
    let opposeSize
    let deathblow = false
    let reduceSL = false
    let sizeCool = ""
    let reroll = false
    let mounted
    let practical = 0
    let qualities
    let mountName
    let mountStrengthBonus
    let mountToughnessBonus
    let mountHeadArmor
    let mountBodyArmor
    let mountLeftLegArmor
    let mountRightLegArmor
    let mountWounds
    let mountDamage

    checkInstall = function() {
        if( ! _.has(state,'WHFP4E')) {
            state.WHFP4E=state.WHFP4E || {};
			setDefaults()
		}
    },

    inputHandler = function(msg_orig) {
        if (msg_orig.content.indexOf('!whfp4e')!==0){
            return;
        }

        var msg = _.clone(msg_orig),cmdDetails,args,player,who

       if (playerIsGM(msg.playerid)) {
              who = 'gm'
        } else {
            who = getObj('player', msg.playerid).get('displayname');
        }

		if(_.has(msg,'inlinerolls')){
			msg.content = inlineExtract(msg);
		}

        //splits the message contents into discrete arguments
		args = msg.content.split(/\s+--/);
	    if(args[0] === '!whfp4e'){
            if(args[1]){
                _.each(_.rest(args,1),(cmd) =>{
                    cmdDetails = cmdExtract(cmd);
                    if (debug){
                        log(cmdDetails)
                    }
                    if (cmdDetails.details.reroll == 'yes') {
                        reroll = true
                        if (['Melee Attack', 'Range Attack'].includes(cmdDetails.details.type)) {
                            commandHandler(cmdDetails)
                            sheetHandler()
                            attackHandler(who)
                            roll = 0
                            restoreOppose()
                            sheetHandler()
                            attackHandler(who)
                        }
                        if (['Melee Oppose', 'Dodge'].includes(cmdDetails.details.type)) {
                            restoreAttack()
                            sheetHandler()
                            attackHandler(who)
                            roll = 0
                            commandHandler(cmdDetails)
                            sheetHandler()
                            attackHandler(who)
                        }
                    } else {
                        commandHandler(cmdDetails,who)
                        sheetHandler()
                        attackHandler(who)
                    }
                 })
            }
    	}
	},

    //Extracts the command details from a command string passed from handleInput
	cmdExtract = function(cmd){
	    var cmdSep = {
	        details:{}
	    },
	    vars,
	    raw,
	    command,
	    details;
        if (debug){
            log('Command Extract')
            log('Command String:' + cmd)
        }

        //split the commands from the tracks or playlists
        raw = cmd.split('|')
        command = raw[0];

        //find the action and set the cmdSep Action
	    cmdSep.action = command.match(/reroll|name|type|weapon|range|target|damage|/);
        //the ./ is an escape within the URL so the hyperlink works.  Remove it
        command.replace('./', '');
        //split additional command actions
 //       _.each(command.replace(cmdSep.action+',','').split(','),(d)=>{
	    _.each(command.replace(cmdSep+',','').split(','),(d)=>{
            vars=d.match(/(character|name|reroll|type|weapon|target|talents|strengthBonus|damageBonus|range|modifier|charging|infighting|advantage|rangeToTarget|ammo|dodge|size|practical|)(?:\:|=)([^,]+)/) || null;
            if(vars){
                cmdSep.details[vars[1]]=vars[2];
            }else{
                cmdSep.details[d]=d;
            }
        });

        return cmdSep;
	},

    restoreAttack = function() {
	    name            = state.WHFP4E.attack.name
        type            = state.WHFP4E.attack.type
        weapon          = state.WHFP4E.attack.weapon
        target          = state.WHFP4E.attack.target
        roll            = state.WHFP4E.attack.roll
        strengthBonus   = state.WHFP4E.attack.strengthBonus
        damageBonus     = state.WHFP4E.attack.damageBonus
        damage          = state.WHFP4E.attack.damage
        weapon          = state.WHFP4E.attack.weapon
        range           = state.WHFP4E.attack.range
        advantage       = state.WHFP4E.attack.advantage
        talents         = state.WHFP4E.attack.talents
        rangeToTarget   = state.WHFP4E.attack.rangeToTarget
        advantage       = state.WHFP4E.attack.advantage
        modifier        = state.WHFP4E.attack.modifier
        ammo            = state.WHFP4E.attack.ammo
        opposeSize      = state.WHFP4E.attack.size
        infighting      = state.WHFP4E.attack.infighting
        charging        = state.WHFP4E.attack.charging
        mounted         = state.WHFP4E.attack.mounted
        practical       = state.WHFP4E.attack.practical
        qualities       = state.WHFP4E.attack.qualities
    },

    restoreOppose = function() {
	    name            = state.WHFP4E.oppose.name
        type            = state.WHFP4E.oppose.type
        weapon          = state.WHFP4E.oppose.weapon
        target          = state.WHFP4E.oppose.target
        roll            = state.WHFP4E.oppose.roll
        strengthBonus   = state.WHFP4E.oppose.strengthBonus
        damageBonus     = state.WHFP4E.oppose.damageBonus
        damage          = state.WHFP4E.oppose.damage
        weapon          = state.WHFP4E.oppose.weapon
        range           = state.WHFP4E.oppose.range
        advantage       = state.WHFP4E.oppose.advantage
        talents         = state.WHFP4E.oppose.talents
        rangeToTarget   = state.WHFP4E.oppose.rangeToTarget
        advantage       = state.WHFP4E.oppose.advantage
        modifier        = state.WHFP4E.oppose.modifier
        ammo            = state.WHFP4E.oppose.ammo
        opposeSize      = state.WHFP4E.oppose.size
        infighting      = state.WHFP4E.oppose.infighting
        charging        = state.WHFP4E.oppose.charging
        mounted         = state.WHFP4E.oppose.mounted
        practical       = state.WHFP4E.oppose.practical
        qualities       = state.WHFP4E.oppose.qualities
    },

	commandHandler = function(cmdDetails){
	    if (debug){
	        log ('Command Handler')
	    }
	    name            = cmdDetails.details.name
        type            = cmdDetails.details.type
        weapon          = cmdDetails.details.weapon
        target          = parseInt(cmdDetails.details.target)
        strengthBonus   = parseInt(cmdDetails.details.strengthBonus)
        damageBonus     = parseInt(cmdDetails.details.damageBonus)
        weapon          = cmdDetails.details.weapon
        range           = cmdDetails.details.range
        advantage       = parseInt(cmdDetails.details.advantage)
        talents         = parseInt(cmdDetails.details.talents)
        rangeToTarget   = parseInt(cmdDetails.details.rangeToTarget)
        advantage       = parseInt(cmdDetails.details.advantage)
        modifier        = parseInt(cmdDetails.details.modifier)
        ammo            = cmdDetails.details.ammo
        opposeSize      = cmdDetails.details.size
        mounted         = cmdDetails.details.mounted
        charging        = cmdDetails.details.charging
        practical       = cmdDetails.details.practical
        qualities       = cmdDetails.details.qualities

        if (type == 'Dodge') {
            target = agility + parseInt(getAttrByName(characterObj.id,'DodgeAdv')) + parseInt(getAttrByName(characterObj.id,'DodgeMisc'))
        }
	}

    sheetHandler = function() {
	    if (debug){
	        log ('Sheet Handler')
	    }
	    log(name)
		characterObj    = findObjs({name: name, _type: 'character'})[0];
		toughness       = parseInt(getAttrByName(characterObj.id,'Toughness'))
        strength	    = parseInt(getAttrByName(characterObj.id, 'Strength'))
        agility	        = parseInt(getAttrByName(characterObj.id, 'Agility'))
		endurance       = toughness + parseInt(getAttrByName(characterObj.id,'EnduranceAdv')) + parseInt(getAttrByName(characterObj.id,'EnduranceMisc'))
        cool            = parseInt(getAttrByName(characterObj.id, 'Willpower'))
		cool            = cool + parseInt(getAttrByName(characterObj.id,'CoolAdv')) + parseInt(getAttrByName(characterObj.id,'CoolMisc'))
        size            = getAttrByName(characterObj.id,'Size')
        dodge           = agility + parseInt(getAttrByName(characterObj.id,'DodgeAdv')) + parseInt(getAttrByName(characterObj.id,'DodgeMisc'))

        if (type == 'Melee Mounted') {
            mountName = getAttrByName(characterObj.id,'MountName')
            mountStrengthBonus = getAttrByName(characterObj.id,'MountStrengthBonus')
            mountHeadArmor = getAttrByName(characterObj.id,'MountHeadArmor')
            mountBodyArmor = getAttrByName(characterObj.id,'MountBodyArmor')
            mountRightLegArmor = getAttrByName(characterObj.id,'MountRightLegArmor')
            mountLeftLegArmor = getAttrByName(characterObj.id,'MountLeftLegArmor')
        }
    },

	attackHandler = function(who){
	    if (debug){
	        log ('Attack Handler')
	    }

	    output = '<div class="sheet-rolltemplate-whfrp2e"> '
        output += '<div class="sheet-rt-card"> '
	    output += '<div class="sheet-rt-header sheet-relative sheet-attack">'
        output += '<div class="sheet-rt-subheader">'+name+'</div>'
        output += '<div class="sheet-rt-title sheet-pad-l-xl sheet-pad-r-xl">'+type+'</div>'
        output += '<div class="sheet-rt-subheader">'+weapon+'</div>'
        output += '</div>';
	    output += '<div class="sheet-main-content">'

		determineSuccess()

        if (['Melee Mounted'].includes(type)) {
            if (mountStrengthBonus > strengthBonus) {
                damage = success + mountStrengthBonus + damageBonus
            } else {
                damage = success + strengthBonus + damageBonus
            }
        } else if (['Melee Attack','Melee Oppose','Melee Unopposed','Melee Dual Wield'].includes(type)) {
		    damage = success + strengthBonus + damageBonus
		} else if (type == 'Range Attack','Range Unopposed') {
		    if (parseInt(strengthBonus > "0")) {
		        damage = strengthBonus + damageBonus
		    } else {
		        damage = damageBonus
		        strengthBonus = 0
		    }
		}

		if (['Melee Attack','Range Attack','Melee Unopposed','Melee Mounted','Melee Dual Wield'].includes(type)) {
            determineHitLocation()
            displayBase()
 			storeAttack()
		}

        if (['Melee Oppose','Dodge'].includes(type)) {
		    determineHitLocation()
            displayBase()
            storeOppose
		}

        output += '</div>';
        output += '</div>';
		sendChat(who,output,null,{noarchive:true});

 		if (['Melee Oppose','Dodge','Melee Unopposed','Range Unopposed'].includes(type)) {
		    displayResults(characterObj, who)
 		}
	},

	determineSuccess = function() {
	    if (roll == 0) {
	        roll 	= Math.floor((Math.random() * 100) + 1);
	    }
		success	= Math.floor(target/10) - Math.floor(roll/10);
	},

	determineHitLocation = function() {
	    let reverse=0

		if (roll.toString().length < 2) {
			reverse = roll * 10
		} else {
			reverse = parseInt(String(roll).split('').reverse().join(''));
		}

		if (reverse >= 1 && reverse <= 9) {
			location 	= 'Head'
		}
		if (reverse >= 10 && reverse <= 24) {
			location 	= 'Left Arm'
		}
		if (reverse >= 25 && reverse <= 44) {
			location 	= 'Right Arm'
		}
		if (reverse >= 45 && reverse <= 79) {
			location 	= 'Body'
		}
		if (reverse >= 80 && reverse <= 89) {
			location 	= 'Left Leg'
		}
		if (reverse >= 90 && reverse <= 100) {
			location 	= 'Right Leg'
		}
	},

    displayBase = function() {
	    if (debug){
	        log ('Display Base')
	    }

        found       = false
        damaging    = false
        undamaging  = false
        damaging    = false
        impact      = false
        deathblow   = false

        //target
        output += addHTMLMessage('Target',true);
        if (type == 'Range Attack') {
            rangeBand()
        }
        if (['Melee Attack','Melee Oppose','Melee Unopposed','Melee Mounted','Melee Dual Wield'].includes(type)) {
            output += addHTMLValue('Reach: ',range,false);
        }

        output += addHTMLValue('Target: ',target,false);

        addAdvantage()
        addModifier()

        if (['Melee Attack','Melee Unopposed','Melee Mounted','Melee Dual Wield'].includes(type)) {
            attackTarget()
        }

        if (type == 'Melee Oppose') {
            opposeTarget()
        }
        if (['Range Attack','Range Unopposed'].includes(type)) {
            rangeTarget()
        }
        if (found) {
            output += addHTMLValue('Final Target: ',target,false);
        }
        output += addHTMLMessage('Roll',true);
        output += addHTMLValue('Roll: ',roll,false);

        //success
        output      += addHTMLMessage('Success Level',true);
        output      += addHTMLValue('SL: ',success,false);
        if (['Melee Attack','Range Attack','Range Unopposed','Melee Unopposed','Melee Mounted','Melee Dual Wield'].includes(type)) {
            attackSL()
        }
        if (['Melee Oppose','Dodge'].includes(type)) {
            opposeSL()
        }
        talentsSL()
        if (found) {
            output      += addHTMLValue('Final SL: ',success,true);
        }

        //damage
        if (type != 'Dodge') {
            output      += addHTMLMessage('Damage',true);
            output      += addHTMLValue('Base: ',(strengthBonus + damageBonus),false);
            damage      = (strengthBonus + damageBonus)

            if (['Melee Attack','Range Attack','Melee Unopposed','Melee Mounted','Melee Dual Wield'].includes(type)) {
                attackDamage()
            }
            if (!damaging) {
                output  += addHTMLValue('SL: ',success,false);
                damage  = damage + success
            }
            output      += addHTMLValue('Final: ',damage,false);
            if (damaging) {
                output  += addHTMLMessage('Damaging Weapon',true,'red');
            }
            if (undamaging) {
                output  += addHTMLMessage('Undamaging Weapon',true,'red');
            }

            //location
            output      += addHTMLMessage('Location',true);
            output      += addHTMLValue('Hit Location: ',location,false);

            determineCritical(roll, target)
            if (impale && !critical) {
                determineImpale(roll, target)
            }

            if (blackpowder) {
                output      += addHTMLMessage('Blackpowder',true, 'green');
            }
            if (dangerous) {
                output      += addHTMLMessage('Dangerous',true, 'green');
            }
            if (reload) {
                output      += addHTMLMessage('Reload',true, 'green');
            }
            if (repeater) {
                output      += addHTMLMessage('Repeater',true, 'green');
            }
            if (deathblow) {
                output      += addHTMLMessage('Attacker Invokes Deathblow',true, 'red');
                output      += addHTMLMessage('Attacker Creates Fear/Terror',true, 'red');
            }
        }

        if (['Melee Attack','Melee Mounted','Melee Dual Wield']) {
            output += addHTMLMessage('<a href="!whfp4e --reroll=yes,name='+name+',weapon='+weapon+',type='+type+',target='+target+',range='+range+',strengthBonus='+strengthBonus+',damageBonus='+damageBonus+',advantage='+advantage+',modifier='+modifier+',talents='+talents+',charging='+charging+',size='+size+'">Reroll</a>',true)
        } else if (type == 'Range Attack') {
            output += addHTMLMessage('<a href="!whfp4e --reroll=yes,name='+name+',weapon='+weapon+',type='+type+',target='+target+',range='+range+',strengthBonus='+strengthBonus+',damageBonus='+damageBonus+',advantage='+advantage+',modifier='+modifier+',talents='+talents+',ammo='+ammo+',size='+size+',rangeToTarget='+rangeToTarget+'">Reroll</a>',true)
        } else if (type == 'Melee Oppose') {
            output += addHTMLMessage('<a href="!whfp4e --reroll=yes,name='+name+',weapon='+weapon+',type='+type+',target='+target+',range='+range+',strengthBonus='+strengthBonus+',damageBonus='+damageBonus+',advantage='+advantage+',modifier='+modifier+',talents='+talents+',size='+size+'">Reroll</a>',true)
        } else if (['Melee Oppose','Dodge'].includes(type)) {
            output += addHTMLMessage('<a href="!whfp4e --reroll=yes,name='+name+',weapon='+weapon+',type='+type+',target='+target+',range='+range+',strengthBonus='+strengthBonus+',damageBonus='+damageBonus+',advantage='+advantage+',modifier='+modifier+',talents='+talents+',size='+size+'">Reroll</a>',true)
        }

//        if (cmdDetails.details.infighting = 'yes') {
//            output  += addHTMLMessage('Infighting Attempted',true,'red');
//        }
    },

    rangeBand = function() {
        if (parseInt(rangeToTarget) <= Math.floor(parseInt(range)/10)) {
            band = "Point Blank"
            rangeModifier = 40
        } else if (parseInt(rangeToTarget) <= Math.floor(parseInt(range)/2)) {
            band = "Short"
            rangeModifier = 20
        } else if (parseInt(rangeToTarget) > Math.floor(parseInt(range)/2) && parseInt(rangeToTarget) < Math.floor(parseInt(range)*2)) {
            band = "Medium"
            rangeModifier = -10
        } else if (parseInt(rangeToTarget) >= Math.floor(parseInt(range)*2)) {
            band = "Long"
            rangeModifier = -10
        } else if (parseInt(rangeToTarget) >= Math.floor(parseInt(range)*3)) {
            band = "Extreme"
            rangeModifier = -20
        }

        output += addHTMLValue('Band: ',band,false);
    },

    rangeTarget = function() {
        if (parseInt(range) > 0) {
            output += addHTMLValue('Modifier: ',rangeModifier,false);
            target = parseInt(target) + parseInt(rangeModifier)
            success = success + parseInt(Math.floor(rangeModifier/10))
            found = true
        }

        if (opposeSize == 'Tiny') {
            output += addHTMLValue('versus ' + size + ':',-30,false);
            target = parseInt(target) - 30
            success = success - 3
            found = true
        } else if (opposeSize == 'Little') {
            output += addHTMLValue('versus ' + size + ':',-20,false);
            target = parseInt(target) - 20
            success = success - 2
            found = true
        } else if (opposeSize == 'Small') {
            output += addHTMLValue('versus ' + size + ':',-10,false);
            target = parseInt(target) - 10
            success = success - 3
            found = true
        } else if (opposeSize == 'Average') {
            output += addHTMLValue('versus ' + size + ':',+0,false);
            target = parseInt(target) - 0
            success = success + 0
            found = true
        } else if (opposeSize == 'Large') {
            output += addHTMLValue('versus ' + size + ':',+20,false);
            target = parseInt(target) + 20
            success = success + 2
            found = true
        } else if (opposeSize == 'Enormous') {
            output += addHTMLValue('versus ' + size + ':',+40,false);
            target = parseInt(target) + 40
            success = success + 4
            found = true
        } else if (opposeSize == 'Monsterous') {
            output += addHTMLValue('versus ' + size + ':',+60,false);
            target = parseInt(target) + 60
            success = success + 6
            found = true
        }

        for (var property in state.WHFP4E.weapon[weapon]) {
            if (property == 'accurate') {
                output += addHTMLValue('Accurate: ','+10',false);
                target = parseInt(target) + 10
                success = success + 1
            }
        }

        for (var property in state.WHFP4E.ammo[ammo]) {
            if (property == 'accurate') {
                output += addHTMLValue('Accurate: ','+10',false);
                target = parseInt(target) + 10
                success = success + 1
            }
        }
    },

    addAdvantage = function() {
        if (parseInt(advantage) > 0) {
            output += addHTMLValue('Advantage: ',(parseInt(advantage) * 10),false);
            target = parseInt(target) + (parseInt(advantage) * 10)
            success = success + parseInt(advantage)
            found = true
        }
    },

    addModifier = function() {
        if (parseInt(modifier) > 0) {
            output += addHTMLValue('Modifier: ',parseInt(modifier),false);
            target = parseInt(target) + (parseInt(modifier))
            success = success + parseInt(Math.floor(modifier/10))
            found = true
        }
    },

    attackTarget = function() {
        if (type == 'Melee Unopposed') {
            output += addHTMLValue('Unopposed: ','20',false);
            target = parseInt(target) + 20
            success = success + 2
            found = true
        }
        if (type == 'Melee Mounted' && opposeSize ) {
            output += addHTMLValue('Mounted: ','20',false);
            target = parseInt(target) + 20
            success = success + 2
            found = true
        }
        if (charging == 'yes') {
            output += addHTMLValue('Charging: ','10',false);
            target = parseInt(target) + 10
            success = success + 1
            found = true
        }
    }

    opposeTarget = function() {
        let fast = false

        for (var property in state.WHFP4E.weapon[weapon]) {
            if (property == 'fast') {
                fast = true
            }
        }

        if (!fast) {
            for (var property in state.WHFP4E.weapon[state.WHFP4E.attack.weapon]) {
                if (property == 'fast') {
                    target = parseInt(target) - 10
                    output  += addHTMLValue('versus Fast: ','-10',false, false, false, 'red');
                    found = true
                }
            }
        }
    },

    attackSL = function() {
        found = false

        checkOpposeSize()
        for (var property in state.WHFP4E.weapon[weapon]) {
            if (property == 'precise') {
                success = parseInt(success) + 1
                output  += addHTMLValue('Precise: ','1',false);
                found = true
            }
            if (property == 'imprecise') {
                success = parseInt(success) -1
                output  += addHTMLValue('Imprecise: ','-1',false);
                found = true
            }
            if (property == 'fast') {
                fast = true
            }
            if (property == 'pummel') {
                pummel = true
            }
            if (property == 'trapblade') {
                trapblade = true
            }
            if (property == 'entangle') {
                entangle = true
            }
            if (property == 'blackpowder') {
                blackpowder = true
            }
            if (property == 'dangerous') {
                dangerous = true
            }
            if (property == 'repeater') {
                repeater = true
            }
            if (property == 'reload') {
                reload = true
            }
            if (property == 'tiring') {
                tiring = true
            }
        }

        if (parseInt(practical) > 0) {
            if (roll > target) {
                success = parseInt(success) + 1
                output  += addHTMLValue('Practical: ','1',false);
                found = true
            }
        }
    },

    opposeSL = function() {
        found = false

        if (['Melee Attack','Melee Unopposed','Melee Mounted','Melee Dual Wield'].includes(state.WHFP4E.attack.type)) {
            checkAttackSize()
        }

        if (state.WHFP4E.attack.range == 'Personal') {
            if (['Very Short','Short','Average','Long','Very Long','Massive'].includes(range)) {
                success = parseInt(success) + 1
                output  += addHTMLValue('Reach: ','1',false);
                found = true
            }
        }
        if (state.WHFP4E.attack.range == 'Very Short') {
            if (['Short','Average','Long','Very Long','Massive'].includes(range)) {
                success = parseInt(success) + 1
                output  += addHTMLValue('Reach: ','1',false);
                found = true
            }
        }
        if (state.WHFP4E.attack.range == 'Short') {
            if (['Average','Long','Very Long','Massive'].includes(range)) {
                success = parseInt(success) + 1
                output  += addHTMLValue('Reach: ','1',false);
                found = true
            }
        }
        if (state.WHFP4E.attack.range == 'Average') {
            if (['Long','Very Long','Massive'].includes(range)) {
                success = parseInt(success) + 1
                output  += addHTMLValue('Reach: ','1',false);
                found = true
            }
        }
        if (state.WHFP4E.attack.range == 'Long') {
            if (['Very Long','Massive'].includes(range)) {
                success = parseInt(success) + 1
                output  += addHTMLValue('Reach: ','1',false);
                found = true
            }
        }
        if (state.WHFP4E.attack.range == 'Long') {
            if (['Massive'].includes(range)) {
                success = parseInt(success) + 1
                output += addHTMLValue('Reach: ','1',false);
                found = true
            }
        }

        for (var property in state.WHFP4E.weapon[state.WHFP4E.attack.weapon]) {
            if (property == 'wrap') {
                success = success - 1
                output += addHTMLValue('versus Wrap: ','-1',false);
                found = true
            }
        }

        for (var property in state.WHFP4E.weapon[weapon]) {
            if (property == 'defensive') {
                success = parseInt(success) + 1
                output += addHTMLValue('Defensive: ','1',false);
                found = true
            }
        }
    },

    talentsSL = function() {
        if (parseInt(talents) > 0) {
            if (parseInt(state.WHFP4E.attack.roll) <= parseInt(state.WHFP4E.attack.target)) {
                success = parseInt(success) + parseInt(talents)
                output  += addHTMLValue('Talents: ','+' + parseInt(talents),false);
                found = true
            }
        }
    },

    attackDamage = function() {
        let damagingApplied = false
        let impactApplied = false

        if (damaging) {
            let unit = parseRoll(roll)
            if (parseInt(unit) == 0) {
                unit = 10
            }
            if (unit > success) {
                damage = parseInt(unit) + strengthBonus + damageBonus
                output += addHTMLValue('Damage SL: ',unit,false);
                damaging = true
                impactApplied = true
            }
        }
        if (impact) {
            let unit = parseRoll(roll)
            damage = parseInt(damage) + parseInt(unit)
            output  += addHTMLValue('Impact: ',unit,false);
        }

        for (var property in state.WHFP4E.weapon[weapon]) {
            if (property == 'damaging' && !damagingApplied) {
                let unit = parseRoll(roll)
                if (parseInt(unit) == 0) {
                    unit = 10
                }
                if (unit > success) {
                    damage = parseInt(unit) + strengthBonus + damageBonus
                    output += addHTMLValue('Damage SL: ',unit,false);
                    damaging = true
                }
            }
            if (property == 'impact' && !impactApplied) {
                let unit = parseRoll(roll)
                damage = parseInt(damage) + parseInt(unit)
                output  += addHTMLValue('Impact: ','+' + unit,false);
            }
            if (property == 'undamaging') {
                undamaging = true
            }
            if (property == 'penetrating') {
                penetrating = true
            }
        }

        for (var property in state.WHFP4E.ammo[ammo]) {
            if (property == 'damage') {
                damage = parseInt(damage) + parseInt(state.WHFP4E.ammo[ammo].damage)
                output += addHTMLValue('Ammo: ',state.WHFP4E.ammo[ammo].damage,false);
            }
            if (property == 'impale') {
                impale = true
            }
            if (property == 'penetrating') {
                penetrating = true
            }
        }

    },

 	storeAttack = function() {
 	    state.WHFP4E.attack.name        = name
		state.WHFP4E.attack.type        = type
		state.WHFP4E.attack.range       = range
		state.WHFP4E.attack.weapon      = weapon
		state.WHFP4E.attack.roll        = roll
		state.WHFP4E.attack.success     = success
		state.WHFP4E.attack.target      = target
		state.WHFP4E.attack.damage      = damage
		state.WHFP4E.attack.location    = location
        state.WHFP4E.attack.strength    = strength
        state.WHFP4E.attack.strengthBonus = strengthBonus
        state.WHFP4E.attack.damageBonus = damageBonus
        state.WHFP4E.attack.endurance   = endurance
        state.WHFP4E.attack.endurance   = endurance
        state.WHFP4E.attack.infighting  = infighting
        state.WHFP4E.attack.charging    = charging
        state.WHFP4E.attack.critical    = critical
        state.WHFP4E.attack.impale      = impale
        state.WHFP4E.attack.undamaging  = undamaging
        state.WHFP4E.attack.band        = band
        state.WHFP4E.attack.pummel      = pummel
        state.WHFP4E.attack.fast        = fast
        state.WHFP4E.attack.trapblade   = trapblade
        state.WHFP4E.attack.entangle    = entangle
        state.WHFP4E.attack.dangerous   = dangerous
        state.WHFP4E.attack.blackpowder = blackpowder
        state.WHFP4E.attack.penetrating = penetrating
        state.WHFP4E.attack.repeater    = repeater
        state.WHFP4E.attack.reload      = reload
        state.WHFP4E.attack.size        = size
        state.WHFP4E.attack.dodge       = dodge
	    if (debug){
	        log(state.WHFP4E.attack)
	    }
	},

 	storeOppose = function(cmdDetails) {
 	    state.WHFP4E.oppose.name        = name
		state.WHFP4E.oppose.type        = type
		state.WHFP4E.oppose.range       = range
		state.WHFP4E.oppose.weapon      = weapon
		state.WHFP4E.oppose.roll        = roll
		state.WHFP4E.oppose.success     = success
		state.WHFP4E.oppose.target      = target
		state.WHFP4E.oppose.damage      = damage
		state.WHFP4E.oppose.location    = location
        state.WHFP4E.oppose.strength    = strength
        state.WHFP4E.oppose.strengthBonus = strengthBonus
        state.WHFP4E.oppose.damageBonus = damageBonus
        state.WHFP4E.oppose.endurance   = endurance
        state.WHFP4E.oppose.infighting  = infighting
        state.WHFP4E.oppose.critical    = critical
        state.WHFP4E.oppose.impale      = impale
        state.WHFP4E.oppose.undamaging  = undamaging
        state.WHFP4E.oppose.band        = band
        state.WHFP4E.oppose.pummel      = pummel
        state.WHFP4E.oppose.fast        = fast
        state.WHFP4E.oppose.trapblade   = trapblade
        state.WHFP4E.oppose.entangle    = entangle
        state.WHFP4E.oppose.dangerous   = dangerous
        state.WHFP4E.oppose.blackpowder = blackpowder
        state.WHFP4E.oppose.penetrating = penetrating
        state.WHFP4E.oppose.repeater    = repeater
        state.WHFP4E.oppose.reload      = reload
        state.WHFP4E.oppose.size        = size
        state.WHFP4E.oppose.dodge       = dodge

	    if (debug) {
	        log(state.WHFP4E.oppose)
	    }
	},

	displayResults = function (characterObj, who) {
        output = '<div class="sheet-rolltemplate-whfrp2e"> '
        output += '<div class="sheet-rt-card"> '
        output += '<div class="sheet-rt-header sheet-relative sheet-attack">'
        output += '<div class="sheet-rt-title sheet-pad-l-xl sheet-pad-r-xl">Results</div>'
        output += '</div>';

        if (state.WHFP4E.attack.infighting == 'yes') {
            output += addHTMLMessage('Infighting Attempt',true,'red');
            determineInfight()
        }

        determineArmor()
        determineResults()

        output += '</div>';
        output += '</div>';

        sendChat(who,output,null,{noarchive:true});
	},

    determineInfight = function () {
        output  += addHTMLValue('Attack SL: ',state.WHFP4E.attack.success,false);
        output  += addHTMLValue('Opposed SL: ',success,false);

        if (parseInt(state.WHFP4E.attack.success) > parseInt(success)) {
            output += addHTMLMessage('Success',true,'green');
            output += addHTMLMessage('Opposed Weapon Changed to Improvised',true);
        } else if (parseInt(success) == parseInt(state.WHFP4E.attack.success)) {
            if (parseInt(target) == parseInt(state.WHFP4E.attack.target)) {
                output += addHTMLMessage('Success',true,'green');
                output += addHTMLMessage('Opposed Weapon Changed to Improvised',true);
            } else {
                output += addHTMLMessage('Failure',true,'green');
            }
        }
    },

	determineArmor = function() {
	    if (debug) {
	        log(location)
	    }

        armor = 0

        //shield
        getAP('armornameS1', 'armornameS2', 'armornameS3', 'armorAPbaseS1', 'armorAPbaseS2', 'armorAPbaseS3', 'armormagicbonusS1', 'armormagicbonusS2', 'armormagicbonusS3', 'armordamageS1', 'armordamageS2', 'armordamageS3', true)

        //location based ap
        if (location == 'Head') {
            getAP('armornameH1', 'armornameH2', 'armornameH3', 'armorAPbaseH1', 'armorAPbaseH2', 'armorAPbaseH3', 'armormagicbonusH1', 'armormagicbonusH2', 'armormagicbonusH3', 'armordamageH1', 'armordamageH2', 'armordamageH3')
        }
        if (location == 'Body') {
            getAP('armornameT1', 'armornameT2', 'armornameT3', 'armorAPbaseT1', 'armorAPbaseT2', 'armorAPbaseT3', 'armormagicbonusT1', 'armormagicbonusT2', 'armormagicbonusT3', 'armordamageT1', 'armordamageT2', 'armordamageT3')
        }
        if (location == 'Right Leg') {
            getAP('armornameRL1', 'armornameRL2', 'armornameRL3', 'armorAPbaseRL1', 'armorAPbaseRL2', 'armorAPbaseRL3', 'armormagicbonusRL1', 'armormagicbonusRL2', 'armormagicbonusRL3', 'armordamageRL1', 'armordamageRL2', 'armordamageRL3')
        }
        if (location == 'Left Leg') {
            getAP('armornameLL1', 'armornameLL2', 'armornameLL3', 'armorAPbaseLL1', 'armorAPbaseLL2', 'armorAPbaseLL3', 'armormagicbonusLL1', 'armormagicbonusLL2', 'armormagicbonusLL3', 'armordamageLL1', 'armordamageLL2', 'armordamageLL3')
        }
        if (location == 'Right Arm') {
            getAP('armornameRA1', 'armornameRA2', 'armornameRA3', 'armorAPbaseRA1', 'armorAPbaseRA2', 'armorAPbaseRA3', 'armormagicbonusRA1', 'armormagicbonusRA2', 'armormagicbonusRA3', 'armordamageRA1', 'armordamageRA2', 'armordamageRA3')
        }
        if (location == 'Left Arm') {
            getAP('armornameLA1', 'armornameLA2', 'armornameLA3', 'armorAPbaseLA1', 'armorAPbaseLA2', 'armorAPbaseLA3', 'armormagicbonusLA1', 'armormagicbonusLA2', 'armormagicbonusLA3', 'armordamageLA1', 'armordamageLA2', 'armordamageLA3')
        }

//        log('leather' + leatherAP)
//        log('mail' + mailAP)
//        log('plate' + plateAP)

        armor       = armor + shieldAP + Math.floor(parseInt(toughness)/10)

        return armor
	},

    determineResults = function() {
        found = false
        let hit = false

        output += addHTMLMessage('SL Results',true);
        output += addHTMLValue('Attack SL: ',state.WHFP4E.attack.success,false);

        if (!['Melee Unopposed','Range Oppose'].includes(type)) {
            output += addHTMLValue('Oppose SL:',success,false)
        }

        if (['Melee Unopposed','Range Oppose'].includes(type)) {
            output += addHTMLMessage('Hit',true,'green')
            hit = true
        } else if (parseInt(state.WHFP4E.attack.success) > parseInt(success)) {
            output += addHTMLMessage('Hit',true,'green')
            hit = true
        } else if (parseInt(success) == parseInt(state.WHFP4E.attack.success)) {
            if (parseInt(state.WHFP4E.attack.target) > parseInt(target)) {
                output += addHTMLMessage('Hit',true,'green');
                hit = true
            } else {
                output += addHTMLMessage('Miss',true,'red');
                hit = false
            }
        } else {
            output += addHTMLMessage('Miss',true,'red');
            hit = false
        }

        if (hit) {
            output += addHTMLMessage('Damage Results',true);
            output += addHTMLValue('Attack Damage:',state.WHFP4E.attack.damage,false);
            output += addHTMLValue('Oppose SL:',success,false);
            output += addHTMLValue('Base Armor:',armor,false);

            if (state.WHFP4E.attack.penetrating) {
                if (plateAP > 0) {
                    output += addHTMLValue('Penetrating:','-1 Plate',false);
                    armor = parseInt(armor) - 1
                }
                if (mailAP > 0) {
                    output += addHTMLValue('Penetrating:','-1 Mail',false);
                    armor = parseInt(armor) - 1
                }
                 if (leatherAP > 0) {
                     output += addHTMLValue('Penetrating:','-' + leatherAP + ' leather',false);
                     armor = parseInt(armor) - leatherAP
                 }
                 if (shieldAP > 0) {
                     output += addHTMLValue('Penetrating:','-' + '-1 Shield', + ' Shield',false);
                     armor = parseInt(armor) - 1
                 }
            }

            if (parseInt(roll) % 2 == 0 && state.WHFP4E.attack.location == 'Head') {
                openHelm    = parseInt(getAttrByName(characterObj.id,'armoropenpenalty'))
                fullHelm    = parseInt(getAttrByName(characterObj.id,'armorhelmpenalty'))
                if (openHelm) {
                    output  += addHTMLValue('Open Helm: -', (plateAP + mailAP), false);
                    armor   = armor - mailAP - plateAP
                    found = true
                }
                if (fullHelm) {
                    output  += addHTMLValue('Full Helm: -', mailAP, false);
                    armor   = armor - mailAP
                    found = true
                }
            }
            if (parseInt(state.WHFP4E.attack.critical)) {
                if (state.WHFP4E.attack.critical && plateAP > 0) {
                    if (state.WHFP4E.attack.impale) {
                        output  += addHTMLValue('Weakpoints: ', '-'+plateAP + 'AP', false);
                        armor   = armor - plateAP
                        found = true
                    }
                }
            }
            if (found) {
                output += addHTMLValue('Final Armor:',armor,false);
            }

            if ((parseInt(state.WHFP4E.attack.damage) - parseInt(success) - armor) <= 0) {
                if (state.WHFP4E.attack.undamaging) {
                    output += addHTMLValue('Damage:','0',true);
                } else {
                    output += addHTMLValue('Damage:','1',true);
                }
            } else {
                output += addHTMLValue('Damage:',(parseInt(state.WHFP4E.attack.damage) - parseInt(success) - armor),true);
            }
        }

        if (parseInt(state.WHFP4E.attack.critical)) {
             if (parseInt(roll) % 2 == 1  && plateAP > 0) {
                 output  += addHTMLMessage('Impenetrable - No Critical',true,'red');
             } else {
                 output  += addHTMLMessage('Attack Critical',true,'green');
             }
        }

        if (state.WHFP4E.attack.critical) {
            output  += addHTMLMessage('Attack Critical',true,'green');
        }
        if (critical) {
            output  += addHTMLMessage('Oppose Critical',true,'green');
        }
        if (parseInt(state.WHFP4E.attack.fumble)) {
             output  += addHTMLMessage('Attack Fumble',true,'red');
        }
        if (fumble) {
            output  += addHTMLMessage('Oppose Fumble',true,'red');
        }

        if (parseInt(state.WHFP4E.attack.pummel)) {
            output  += addHTMLMessage('Pummel',true);
            if (location == 'head') {
                opposedTest(state.WHFP4E.attack.strength, endurance)
                if (condition) {
                    output  += addHTMLMessage('Opposition Stunned',true,'green');
                } else {
                    output  += addHTMLMessage('No Effect',true,'red');
                }
            }
        }
        if (state.WHFP4E.attack.trapblade) {
            output  += addHTMLMessage('Trap Blade',true);
            opposedTest(state.WHFP4E.attack.strength, strength)
            if (impressive) {
                output  += addHTMLMessage('Weapon Broken',true,'green');
            } else if (condition) {
                output  += addHTMLMessage('Weapon Dropped',true,'green');
            } else {
                output  += addHTMLMessage('No Effect',true,'red');
            }
        }
        if (state.WHFP4E.attack.blackpowder) {
            output  += addHTMLMessage('Blackpowder',true);

            standardTest(cool)
            if (condition) {
                output  += addHTMLMessage('Target Broken',true,'green');
            } else {
                output  += addHTMLMessage('No Effect',true,'red');
            }
        }
        if (state.WHFP4E.attack.entangle) {
            output  += addHTMLMessage('Entangle',true);
            opposedTest(state.WHFP4E.attack.strength, strength)
            if (condition) {
                output  += addHTMLMessage('Entangled',true,'green');
            } else {
                output  += addHTMLMessage('No Effect',true,'red');
            }
        }
        if (state.WHFP4E.attack.dangerous) {
            output  += addHTMLMessage('Dangerous',true);
            if (parseInt(parseRoll(state.WHFP4E.attack.roll))) {
                output  += addHTMLMessage('Dangerous Weapon Fumble',true,'red');
            } else {
                output  += addHTMLMessage('No Effect',true,'red');
            }
        }
    },

    checkOpposeSize = function() {

        if (type == 'Melee Mounted') {
            size = 'Large'
        }

        log(size)
        if (size == 'Little') {
            if (['Tiny'].includes(opposeSize)) {
                damaging = true
                deathblow = true
                reduceSL = true
            }
        } else if (size == 'Small') {
            if (['Tiny','Little'].includes(opposeSize)) {
                damaging = true
                deathblow = true
                reduceSL = true
            }
            if (['Tiny'].includes(opposeSize)) {
                impact = true
                reduceSL = true
            }
        } else if (size == 'Average') {
            if (['Tiny','Little','Small'].includes(opposeSize)) {
                damaging = true
                deathblow = true
                reduceSL = true
            }
            if (['Tiny','Little'].includes(opposeSize)) {
                impact = true
            }
        } else if (size == 'Large') {
            if (['Tiny','Little','Small','Average'].includes(opposeSize)) {
                damaging = true
                deathblow = true
                reduceSL = true
            }
            if (['Tiny','Little','Small'].includes(opposeSize)) {
                impact = true
            }
        } else if (size == 'Enormous') {
            if (['Tiny','Little','Small', 'Average', 'Large'].includes(opposeSize)) {
                damaging = true
                deathblow = true
                reduceSL = true
            }
            if (['Tiny','Little','Small','Average'].includes(opposeSize)) {
                impact = true
            }
        } else if (size == 'Monsterous') {
            if (['Tiny','Little','Small', 'Average', 'Large', 'Enormous'].includes(opposeSize)) {
                damaging = true
                deathblow = true
                reduceSL = true
            }
            if (['Tiny','Little','Small', 'Average', 'Large'].includes(opposeSize)) {
                impact = true
            }
        }
    }

    checkAttackSize = function() {

        log(state.WHFP4E.attack.size)
        if (size == 'Tiny') {
            if (['Little','Small', 'Average', 'Large', 'Enormous','Monstrous'].includes(state.WHFP4E.attack.size)) {
                success = parseInt(success) - 2
                output += addHTMLValue('Size: ','-2',false);
                found = true
            }
        } else if (size == 'Little') {
            if (['Small', 'Average', 'Large', 'Enormous','Monstrous'].includes(state.WHFP4E.attack.size)) {
                success = parseInt(success) - 2
                output += addHTMLValue('Size: ','-2',false);
                found = true
            }
         } else if (size == 'Small') {
             if (['Average', 'Large', 'Enormous','Monstrous'].includes(state.WHFP4E.attack.size)) {
                 success = parseInt(success) - 2
                 output += addHTMLValue('Size: ','-2',false);
                 found = true
             }
         } else if (size == 'Average') {
             if (['Large', 'Enormous','Monstrous'].includes(state.WHFP4E.attack.size)) {
                 success = parseInt(success) - 2
                 output += addHTMLValue('Size: ','-2',false);
                 found = true
             }
         } else if (size == 'Large') {
             if (['Enormous','Monstrous'].includes(state.WHFP4E.attack.size)) {
                 success = parseInt(success) - 2
                 output += addHTMLValue('Size: ','-2',false);
                 found = true
             }
         } else if (size == 'Enormous') {
             if (['Monstrous'].includes(state.WHFP4E.attack.size)) {
                 success = parseInt(success) - 2
                 output += addHTMLValue('Size: ','-2',false);
                 found = true
             }
        }
    }

    standardTest = function(oppose) {
        let opposeSuccess
        let opposeTarget

        target = oppose
        output += addHTMLValue('Oppose Target:',target,false);
        determineSuccess()
        output += addHTMLValue('Oppose Roll:',roll,false);
        opposeSuccess = Math.floor((success - roll)/10)
        output += addHTMLValue('Oppose SL:',opposeSuccess,false);

        if (parseInt(roll) > parseInt(target)) {
            condition = true
        } else {
            condition = false
        }
    },

    opposedTest = function(sttack, oppose) {
        let attackSuccess
        let opposeSuccess
        let attackTarget
        let opposeTarget

        target = attack
        output += addHTMLValue('Attack Target:',attack,false);
        determineSuccess()
        output += addHTMLValue('Attack Roll:',roll,false);
        attackSuccess = Math.floor((success - roll)/10)
        output += addHTMLValue('Attack SL:',success,false);

        target = oppose
        output += addHTMLValue('Oppose Target:',target,false);
        determineSuccess()
        output += addHTMLValue('Oppose Roll:',roll,false);
        opposeSuccess = Math.floor((success - roll)/10)
        output += addHTMLValue('Oppose SL:',opposeSuccess,false);

        if (parseInt(attackSuccess) - parseInt(opposeSuccess) >= 6) {
            impressive = true
        }
        if (parseInt(attackSuccess) > parseInt(opposeSuccess)) {
            condition = true
        } else if (parseInt(attackSuccess) = parseInt(opposeSuccess)) {
            if (parseInt(attackSuccess) = parseInt(opposeSuccess)) {
                if (parseInt(state.WHFP4E.attack.target) > parseInt(target)) {
                    condition = true
                }
            }
        } else {
            condition = false
        }
    },

    getAP = function(worn1, worn2, worn3, apBase1, apBase2, apBase3, apMagic1, apMagic2, apMagic3, apDamage1, apDamage2, apDamage3, shield) {
        let leather = getAttrByName(characterObj.id, worn1)
        let mail    = getAttrByName(characterObj.id, worn2)
        let plate   = getAttrByName(characterObj.id, worn3)

        leatherAP   = parseInt(getAttrByName(characterObj.id, apBase1)) + parseInt(getAttrByName(characterObj.id, apMagic1)) + parseInt(getAttrByName(characterObj.id, apDamage1))
        mailAP	    = parseInt(getAttrByName(characterObj.id, apBase2)) + parseInt(getAttrByName(characterObj.id, apMagic2)) + parseInt(getAttrByName(characterObj.id ,apDamage2))
        plateAP	    = parseInt(getAttrByName(characterObj.id, apBase3)) + parseInt(getAttrByName(characterObj.id, apMagic3)) + parseInt(getAttrByName(characterObj.id, apDamage3))
//        log('leather'+leather.length)
//        log('mail'+mail.length)
//        log('p0late'+plate.length)

        if (leather.length > 0) {
            if (shield) {
                shieldAP = leatherAP
            } else {
                armor = armor + leatherAP
            }
        } else {
            leatherAP = 0
        }
        if (mail.length > 0) {
            if (shield) {
                shieldAP = mailAP
            } else {
                armor = armor + mailAP
            }
        } else {
            mailAP = 0
        }
        if (plate.length > 0) {
            if (shield) {
                shieldAP = plateAP
            } else {
                armor = armor + plateAP
            }
        } else {
            plateAP = 0
        }
//                log('leatherAP'+leatherAP)
//                log('mailAP'+mailAP)
//                log('plateAP'+plateAP)
    },

	parseRoll = function (roll) {
	    let unit = 0
	    let parse = roll.toString()

		if (roll >= 10 && roll <= 99) {
			unit = parse.substring(1)
		} else if (roll < 10) {
			unit = roll
		} else {
			unit = 0
		}

		return unit
	},

    determineCritical = function(roll, target) {
        if ([11, 22, 33, 44, 55, 66, 77 ,88, 99].includes(parseInt(roll))) {
            if (parseInt(roll) <= parseInt(target)) {
                output      += addHTMLMessage('Critical',true,'green');
                critical    = true
                found       = true
            } else {
                output      += addHTMLMessage('Fumble',true,'red');
                found       = true
            }
        }
    },

    determineImpale = function(roll, target) {
        if ([10, 20, 30, 40, 50, 60, 70 ,80, 90].includes(parseInt(roll))) {
            if (parseInt(roll) <= parseInt(target)) {
                output      += addHTMLMessage('Critical',true,'green');
                critical    = true
                impale      = true
                found       = true
            } else {
                output      += addHTMLMessage('Fumble',true,'red');
                found       = true
            }
        }
    },

    addHTMLValue = function(label,value,highlight,color){
        var html='';
        var bold = ""

        if (!color) {
            color = 'normal'
        }
        if (!highlight) {
            bold = 'normal'
        } else {
            bold = 'bold'
        }

	    html = '<div class="sheet-row">';
        html += '<div class="sheet-col-11-24 sheet-pad-l-md sheet-pad-r-md sheet-rt-key" >'+label+'</div>'
        html += '<div class="sheet-col-13-24 sheet-pad-r-sm sheet-rt-value" style="font-weight:'+bold+';color:'+color+'">'+value+'</div>'
        html += '</div>'

        return html;
    },

    addHTMLMessage = function(label,bold,color,noCenter){
        let html='', center

        if (!color) {
            color = 'normal'
        }

        if (!noCenter) {
            center = 'center'
        } else {
            center = 'normal'
        }

 	    html = '<div class="sheet-row">';
 	    if (bold) {
 	        html += '<div class="sheet-col-1" style="text-align:'+ center +';font-weight:bold;color:'+color+'">'+label+'</div>'
 	    } else {
 	        html += '<div class="sheet-col-1" style="text-align:'+ center +';color:'+color+'">'+label+'</div>'
 	    }
        html += '</div>'

        return html;
    },

    addHTML = function(label,value,highlight,message,center,color){
        var html='';

	    html = '<div class="sheet-row">';

        if (!center) {
            center = 'normal'
        }
        if (!color) {
            color = 'normal'
        }

        if (!message) {
            html +=  '<div class="sheet-col-11-24 sheet-pad-l-md sheet-pad-r-md sheet-rt-key">'+label+':</div>'
            if (highlight) {
                if (value >= 0) {
                    html += '<div class="sheet-col-13-24 sheet-pad-r-sm sheet-rt-value" style="color:green;font-weight:bold">'+value+'</div>'
                } else {
                    html += '<div class="sheet-col-13-24 sheet-pad-r-sm sheet-rt-value" style="color:red;font-weight:bold">'+value+'</div>'
                }
            } else {
                html += '<div class="sheet-col-13-24 sheet-pad-r-sm sheet-rt-value">'+value+'</div>'
            }
        } else {
            if (center) {
                if (highlight) {
                    html += '<div class="sheet-col-1" style="text-align:center;font-weight:bold;color:'+color+'" >'+label+'</div>'
                } else {
                    html += '<div class="sheet-col-1" style="text-align:center;color:'+color+'" >'+label+'</div>'
                }

            } else {
                html += '<div class="sheet-col-1">'+label+'</div>'
            }

        }

        html += '</div>'

        return html;
    },

    addDualHTML = function(label1,value1,label2,value2,background,color1,color2,style){
        var html='';

	    html =   '<div style="text-align:center;background-color:'+background+'">';
        html +=       '<span style="text-align:center;font-weight:'+style+';color:'+color1+'">'+label1+' '+value1+'  </span><span style="text-align:center;font-style:'+style+';color:'+color2+';background-color:'+background+'">'+label2+' '+value2+'</span>'
        html +=   '</div>';

        return html;
    },

    addSpacer = function(){
        var html='';

        html += '<hr>';
        return html;
    },

    setDefaults = function (reset) {
        if (debug) {
            log ('Set Defaults')
        }

        const combatDefaults = {
		    weapon: {
				'Hand Weapon': {
				},
				'Improvised Weapon': {
					undamaging: true,
				},
				'Dagger': {
				},
				'Knife': {
					undamaging: true,
				},
				'Shield': {
					defensive: true,
				},
				'Cavalry Hammer': {
					pummel: true,
				},
				'Lance': {
					impact: true,
					impale: true,
				},
				'Foil': {
					fast: true,
					impale: true,
					precise: true,
					undamaging: true,
				},
				'Rapier': {
					fast: true,
					impale: true,
				},
				'Unarmed': {
					undamaging: true,
				},
				'Knuckledusters': {
					undamaging: true,
				},
				'Grain Flail': {
					distract: true,
					imprecise: true,
					wrap: true,
				},
				'Flail': {
					distract: true,
					wrap: true,
				},
				'Military Flail': {
					distract: true,
					impact: true,
					tiring: true,
					wrap: true,
				},
				'Main Gauche': {
					defensive: true,
				},
				'Swordbreaker': {
					defensive: true,
					trapBlade: true,
				},
				'Halberd': {
					defensive: true,
					hack: true,
					impale: true,
				},
				'Spear': {
					impale: true,
				},
				'Pike': {
					impale: true,
				},
				'Quarter Staff': {
					defensive: true,
					pummel: true,
				},
				'Bastard Sword': {
					defensive: true,
					damaging: true,
				},
				'Great Axe': {
					hack: true,
					impact: true,
					tiring: true,
				},
				'Pick': {
					damaging: true,
					impale: true,
					slow: true,
				},
				'Warhammer': {
					damaging: true,
					pummel: true,
					slow: true,
				},
				'Zweihander': {
					damaging: true,
					hack: true,
				},
				'Blunderbuss': {
					blast: 3,
					dangerous: true,
					reload: 2,
					damaging: true,
					blackpowder: true,
				},
				'Hochland Long Rifle': {
					accurate: true,
					precise: true,
					reload: 4,
					damaging: true,
					blackpowder: true,
				},
				'Handgun': {
					reload: 3,
					damaging: true,
					blackpowder: true,
				},
				'Pistol': {
					damaging: true,
					blackpowder: true,
					pistol: true,
					reload: 3,
				},
				'Elf Bow': {
					precise: true,
					damaging: true,
				},
				'Long Bow': {
					damaging: true,
				},
				'Bow': {
				},
				'Shortbow': {
				},
				'Crossbow Pistol': {
					pistol: true,
				},
				'Heavy Crossbow': {
					damaging: true,
					reload: 2,
				},
				'Crossbow': {
					damaging: true,
					reload: 1,
				},
				'Repeater Handgun': {
					reload: 5,
					damaging: true,
					blackpowder: true,
					dangerous: true,
					repeater: 4
				},
				'Repeater Pistol': {
					reload: 4,
					damaging: true,
					blackpowder: true,
					dangerous: true,
					repeater: 1
				},
				'Lasso': {
					entangle: true,
				},
				'Whip': {
					entangle: true,
				},
				'Sling': {
				},
				'Staff Sling': {
				},
				'Bolas': {
					entangle: true,
				},
				'Dart': {
					impale: true,
				},
				'Javelin': {
					impale: true,
				},
				'Rock': {
				},
				'Throwing Axe': {
					hack: true,
				},
				'Throwing Knife': {
					hack: true,
				},
		    },
		    ammo: {
		        'Bullet and Powder': {
		            damage: 1,
		            impale: true,
		            penetrating: true,
		        },
		        'Improvised Shot and Powder': {
		            damage: 0,
		        },
		        'Small Shot and Powder': {
		            blast: 1,
		        },
		        'Arrow': {
		            impale: true,
		        },
		        'Elf Arrow': {
		            damage: 1,
		            accurate: true,
		            impale: true,
		            penetrating: true,
		        },
		        'Bolt': {
		            impale: true,
		        },
		        'Lead Bullet': {
		            damage: 1,
		            pummel: true,
		        },
		        'Stone Bullet': {
		            pummel: true,
		        },
		    },
			armor: {
				leatherSkullcap: {
					key: 'Leather Skullcap'
				},
				leatherBreastplate: {
					key: 'Leather Breastplate'
				},
				mailCoif: {
					key: 'Mail Coif',
					partial: true,
				},
				openHelm: {
					key: 'Open Helm',
					partial: true,
				},
				plateBreastplate: {
					key: 'Plate Breastplate',
					impenetrable: true,
					weakpoints: true,
				},
				bracers: {
					key: 'Plate Bracers',
					impenetrable: true,
					weakpoints: true,
				},
				plateLeggings: {
					key: 'Plate Leggings',
					impenetrable: true,
					weakpoints: true,
				},
				Helm: {
					key: 'Full Helm',
					impenetrable: true,
					weakpoints: true,
				},
			},
			attack: {
                name: 'Attack',
                key: 'attack',
                name: null,
                type: null,
                weapon: null,
                range: null,
                roll: 0,
                target: 0,
                success: 0,
                talents: 0,
                damage: 0,
                location: null,
                strength: 0,
                endurance: 0,
                infighting: 'no',
                strengthBonus: 0,
                damageBonus: 0,
                charging:'no',
                wrap: true,
                critical: false,
                undamaging: false,
                impale: false,
                band: false,
                fumble: false,
                pummel: false,
                trapblade: false,
                entangle: false,
                dangerous: false,
                blackpowder: false,
                penetrating: false,
                repeater: false,
                reload: false,
                size: null,
                dodge: 0,
                mounted: 'no',
                opposeSize: null,
                practical: 0,
                qualities: null
			},
			oppose: {
                name: 'Attack',
                key: 'attack',
                name: null,
                type: null,
                weapon: null,
                range: null,
                roll: 0,
                target: 0,
                success: 0,
                talents: 0,
                damage: 0,
                location: null,
                strength: 0,
                endurance: 0,
                infighting: 'no',
                strengthBonus: 0,
                damageBonus: 0,
                charging:'no',
                wrap: true,
                critical: false,
                undamaging: false,
                impale: false,
                band: false,
                fumble: false,
                pummel: false,
                trapblade: false,
                entangle: false,
                dangerous: false,
                blackpowder: false,
                penetrating: false,
                repeater: false,
                reload: false,
                size: null,
                dodge: 0,
                mounted: 'no',
                practical: 0,
                qualities: null
			}
		}

        state.WHFP4E = combatDefaults
        log(state.WHFP4E)
    },

    RegisterEventHandlers = function() {
        on('chat:message', inputHandler);
    };

    return {
        CheckInstall: checkInstall,
    	RegisterEventHandlers: RegisterEventHandlers
	}
}());

on("ready",function(){
    'use strict';

    WHFP4E.CheckInstall();
    WHFP4E.RegisterEventHandlers();

});
