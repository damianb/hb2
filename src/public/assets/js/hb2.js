$().ready(function() {
	$('div#ble').hide()
	$('div#nib').hover(
		function() {
			$('#ble').show()
		},
		function() {
			$('#ble').hide()
		}
	)
})