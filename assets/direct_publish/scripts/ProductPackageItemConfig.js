// This file was copied from the Game's ProductPackageItemConfig file

function getCurrencyAmount(productPackageData) {
	var result = formatNumber(productPackageData.amount);
	if (result.length > 8) {
		result = numberAsShortString(productPackageData.amount, '', true);
	}
	return result;
}

function getFreeSpinText(productPackageData) {
	return productPackageData.amount;
}

function getFreeSpinBetSize(productPackageData) {
	return formatNumber(productPackageData.betSize);
}

function getMultiplierText(productPackageData) {
	var multiplier = productPackageData.multiplier;
	return multiplier + 'x';
}

function getDurationText(productPackageData) {
	return productPackageData.duration;
}

function getKickbackPercent(productPackageData) {
	var purchaserPercent = productPackageData.purchaserPercent;
	return '+' + purchaserPercent + '%';
}

function getChestAmount(productPackageData) {
	return productPackageData.amount;
}

function getFrameAmount(productPackageData) {
	return productPackageData.amount;
}

module.exports = Object.freeze({
	ProductPackageItemChips: {
		default: {
			// nameText: 'Chips',
			nameText: (!CC_EDITOR && Game.isSlotzilla()) ? 'Coins' : 'Chips',
			// 	.replace(/[a-z]/i, function (ch) { return ch.toUpperCase(); }),
			// iconImageName: (SAWindowLayer.getInstance().getGameClient().isSlotzilla())
			// 	? 'neon-store___confirmation___productPackage___jms___coins-05.png'
			// 	: 'neon-store___confirmation___productPackage___chips-05.png',
			amountText: getCurrencyAmount,
		},
	},
	ProductPackageItemGold: {
		default: {
			nameText: 'Gold',
			iconImageName: 'neon-store___confirmation___productPackage___gold-02.png',
			amountText: getCurrencyAmount,
		},
	},
	ProductPackageItemFreeSpins: {
		default: {
			nameText: 'Free Spins',
			iconImageName: '',               // TODO
			amountText: getFreeSpinText,
			iconText: getFreeSpinBetSize,
		},
	},
	ProductPackageItemBoost: {
		typeKey: 'boostType',
		Bronze: {
			nameText: 'Vault Boost',
			iconImageName: 'neon-store___confirmation___productPackage___bronze-vault.png',
			iconText: getMultiplierText,
			amountText: getDurationText,
		},
	},
	ProductPackageItemClubKickback: {
		default: {
			nameText: '& Kickbacks',
			iconImageName: 'neon-store___confirmation___productPackage___club-kickback-icon.png',
			amountText: getKickbackPercent,
		},
	},
	ProductPackageItemCollectionChest: {
		typeKey: 'tier',
		1: {
			nameText: "Large Chest",
			iconImageName: 'neon-store___confirmation___productPackage___chest-large-icon.png',
			amountText: getChestAmount,
		},
		2: {
			nameText: "Gigantic Chest",
			iconImageName: 'neon-store___confirmation___productPackage___chest-gigantic-icon.png',
			amountText: getChestAmount,
		},
		3: {
			nameText: "Enormous Chest",
			iconImageName: 'neon-store___confirmation___productPackage___chest-enormous-icon.png',
			amountText: getChestAmount,
		},
		4: {
			nameText: "Massive Chest",
			iconImageName: 'neon-store___confirmation___productPackage___chest-massive-icon.png',
			amountText: getChestAmount,
		},
		5: {
			nameText: "Colossal Chest",
			iconImageName: 'neon-store___confirmation___productPackage___chest-colossal-icon.png',
			amountText: getChestAmount,
		}
	},
	ProductPackageItemCollectionTokens: {
		typeKey: 'tokenID',
		// ........
		// TODO this item type needs a lot of filling out
	},
	ProductPackageItemCollectionFrames: {
		default: {
			amount: 0,
			nameText: 'Avatar Frame',  // TODO: This is a temp solution for the Bonanza release
			amountText: getFrameAmount,
		}
	},
	numberAsShortString: numberAsShortString
});

// Format a number (add commas to large numbers)
function formatNumber(number) {
	if (!number) {
		return '0';
	}
	return Math.max(0, number).toFixed(0).replace(/(?=(?:\d{3})+$)(?!^)/g, ',');
}

function numberAsShortString(number, appendString, truncateDecimals) {
	var powerSymbols = ["", "K", "M", "B", "T", "Q", "X"];
	number = parseInt(number);

	if (!appendString) {
		appendString = "";
	}

	if (number < 0) {
		appendString = `-${appendString}`;
		number *= -1;
	}
	// Reduce size of iNum
	var power = 0;
	if (number < 1000) {
		var roundedNumber = Math.round(number);
		var symbol = powerSymbols[power];
		return `${appendString}${roundedNumber}${symbol}`;
	} else {
		power++;
	}
	while (number >= 1000000) {
		power++;
		number /= 1000;
	}
	if (power >= powerSymbols.length) {
		power = powerSymbols.length - 1;
	}
	
	var flooredValue = Math.floor(number);
	var decimalPlaces = 0;
	
	if (number == 0) {
		return "0";
	} else if (number < 10000 && (flooredValue % 100)) {
		decimalPlaces = 2;
	} else if (number < 100000 && (flooredValue % 1000)) {
		decimalPlaces = 1;
	} else if (number < 1000000) {
		decimalPlaces = 0;
	} else {
		return "";
	}

	var dividedNumber = number / 1000.0;
	if (truncateDecimals) {
		dividedNumber = Math.floor(number / Math.pow(10, 3 - decimalPlaces)) / Math.pow(10, decimalPlaces);
	}
	var roundedNumber = dividedNumber.toFixed(decimalPlaces);
	return `${appendString}${roundedNumber}${powerSymbols[power]}`;
}