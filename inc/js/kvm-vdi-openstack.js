function drawOpenStackVMTable(obj, type, i){
    var machine_types=[];
    machine_types['sourcemachine']='Source machine';
    machine_types['initialmachine']='Initial machine';
    machine_types['vdimachine']='VDI machine';
    machine_types['simplemachine']='Simple machine';
    var tab=['1','11'];
    var power_button="<a href=\"#\" class=\"power-button\" id=\"" + obj['osInstanceId'] + "\" data-power=\"down\" data-power-button-rowid=\"" + obj['id'] +"\"><i class=\"text-danger fa fa-stop fa-fw\"></i>Power down</i></a>";
    if (obj['state'] != "Running")
        power_button="<a href=\"#\" class=\"power-button\" id=\"" + obj['osInstanceId'] + "\" data-power=\"up\" data-power-button-rowid=\"" + obj['id'] +"\"><i class=\"text-success fa fa-play fa-fw\"></i>Power up</a>";
    var additional_buttons='';
    var rowclass='';
    if (type == 'Initial'){
        rowclass = ' info';
        tab=['3','9 glyphicon glyphicon-menu-down'];
        additional_buttons="\
        <div class=\"btn-group\">\
            <button class=\"btn btn-default dropdown-toggle\" aria-expanded=\"false\" aria-haspopup=\"true\" data-toggle=\"dropdown\" type=\"button\">\
                VDI control\
                <span class=\"caret\"></span>\
            </button>\
        </div>";
    }
    if (type == 'VDI'){
        tab=['5','7 glyphicon glyphicon-menu-right'];
        rowclass = ' warning';
    }
    var table_rows="\
<tr class=\"table-stripe-bottom-line\" id=\"row-name-" + obj['id'] + "\">\
    <td class=\"col-md-1 clickable parent\" id=\"" + obj['id'] + "\" data-toggle=\"collapse\" data-target=\".child-" + obj['id'] + "\" >\
        <div class=\"row\">\
            <div class=\"col-md-" + tab[0] + "\"></div>\
            <div class=\"col-md-" + tab[1] + "\">" + i + "</div>\
        </div>\
    </td>\
    <td class=\"col-md-2\"><a data-toggle=\"modal\" href=\"vm_info.php?vm=" + obj['osInstanceId'] + "\" data-target=\"#modalWm\">" + obj['name'] + "</a> </td>\
    <td class=\"col-md-1\">" + machine_types[obj['machine_type']] + "</td>\
    <td class=\"col-md-1\">" + obj['source_volume_machine'] + "</td>\
    <td class=\"col-md-1\"><input type=\"checkbox\" checked onclick='handleSnapshot(this);' id=\"" + obj['osInstanceId'] + "\"></td>\
    <td class=\"col-md-1\"><input type=\"checkbox\"  onclick='handleMaintenance(this);' id=\"" + obj['osInstanceId'] + "\"></td>\
    <td class=\"col-md-2\">\
        <div class=\"btn-group\">\
            <button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"VMSActionMenu\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">VM Actions\
                <span class=\"caret\"></span>\
            </button>\
            <ul class=\"dropdown-menu\" aria-labelledby=\"VMSActionMenu\">\
                <li class=\"lockable-vm-buttons-" + obj['id'] + "\">\
                    " + power_button + "\
                </li>\
                <li role=\"separator\" class=\"divider\"></li>\
                <li class=\"lockable-vm-buttons-" + obj['id'] + "\"><a href=\"delete_vm.php?vm=43" + obj['osInstanceId'] + "\" onclick=\"return confirmBox('Are you sure?');\">\
                    <i class=\"fa fa-trash-o fa-fw text-danger\"></i>Delete machine</a>\
                </li>\
            </ul>\
        </div>\
        " + additional_buttons + "\
    </td>\
    <td class=\"col-md-3\">\
        <i id=\"os-type-" + obj['id'] + "\">" + obj['os_type'] +"</i>\
        <i> &#47; </i>\
        <i id=\"vm-state-" + obj['id'] + "\">" + obj['state'] + "</i>\
        <i> &#47; </i>\
        <i id=\"vm-user\"><i class=\"text-muted\">Nobody</i></i>\
        <div class=\"row hide\" id=\"progress-bar-" + obj['id'] + "\">\
            <div class=\"col-md-5\">\
                <div class=\"progress\">\
                    <div class=\"progress-bar progress-bar-info progress-bar-striped active\" role=\"progressbar\"\
                        aria-valuenow=\"100\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width:100%\">\
                    </div>\
                </div>\
                <div class=\"col-md-7\"></div>\
            </div>\
        </div>\
    </td>\
</tr>"
    if (type == 'SimpleSource')
        $('#OpenstackVmTable').append(table_rows);
    else {
        var parent_row = document.getElementById("row-name-" + obj['source_volume']);
        var row = document.createElement('tr');
        row.setAttribute("class","table-stripe-bottom-line" + rowclass);
        row.setAttribute("id","row-name-" + obj['id']);
        row.innerHTML = table_rows;
        parent_row.parentNode.insertBefore(row, parent_row.nextSibling);
    }
}
function drawOpenstackVmTable(){
    $.getJSON("inc/infrastructure/OpenStack/ListVms.php", {},  function(json){

        var initial_machines=[];
        var vdi_machines=[];
        var x=0;;
        $.each(json, function(i, obj){
            if (!obj['source_volume_machine'])//remove NULL
                obj['source_volume_machine']='';
            if (!obj['machine_type'])
                obj['machine_type'] = 'simplemachine';
            if (obj['machine_type'] == 'initialmachine')
                initial_machines.push(obj)
            if (obj['machine_type'] == 'vdimachine')
                vdi_machines.push(obj);
            if (obj['machine_type'] == 'sourcemachine' || obj['machine_type'] == 'simplemachine')
               drawOpenStackVMTable(obj, 'SimpleSource', ++x);
        });
        //insert initial machine as child to source machine
        var i=initial_machines.length;
        x=0;
        while (initial_machines.length > 0){
            var obj = initial_machines.pop();
            drawOpenStackVMTable(obj, 'Initial', '');
            --i;
        }
        //insert vdi machine as child to initial machine
        var i=vdi_machines.length;
        while (vdi_machines.length > 0){
            var obj = vdi_machines.pop();
            drawOpenStackVMTable(obj, 'VDI', '');
            --i;
        }
    });
}
function reloadOpenStackVmTable(){
    $('#OpenstackVmTable').html('');
    drawOpenstackVmTable();
}
function drawVMStatus(row_id, vm_id, power_state){
    var state_should_be=0;
    if (power_state=='up') //define what powerstate we called
        state_should_be=1; //we need machine state to become running (1)
    else
        state_should_be=4; //we need machine state to become shutdown (4)
    run_query();
    function run_query(){
        $.post({
            url : 'inc/infrastructure/OpenStack/GetVMInfo.php',
                data: {
                    vm_id: vm_id,
                },
                success:function (data) {
                    var reply=jQuery.parseJSON(data);
                    if (reply['server']['OS-EXT-STS:task_state'] == 'Powering on'){
                            $('#vm-state-' + row_id).text('Powering on');
                        }
                    if (reply['server']['OS-EXT-STS:power_state'] == state_should_be){ //machine is in wanted state
                        $('#progress-bar-' + row_id).addClass('hide');
                        if (power_state == 'up'){
                            $('#vm-state-' + row_id).text('Running');
                            $('#' + vm_id + '.power-button').html('<i class=\"text-danger fa fa-stop fa-fw\"></i>Power down</i>');
                            $('#' + vm_id + '.power-button').attr('data-power', 'down');
                        }
                        else{
                            $('#vm-state-' + row_id).text('Shutoff');
                            $('#' + vm_id + '.power-button').html('<i class=\"text-success fa fa-play fa-fw\"></i>Power up</a>');
                            $('#' + vm_id + '.power-button').attr('data-power', 'up');
                        }
                    }
                    else{
                        setTimeout(function() {run_query()}, 4000);
                    }
                }
            });
    }
}
function vmPowerCycle(vm_array){
    $.each(vm_array, function(i, obj){
        $("#progress-bar-" + obj['row_id']).removeClass('hide');
        $.post({
            url : 'inc/infrastructure/OpenStack/PowerCycle.php',
            data: {
                vm_id: obj['vm_id'],
                power_state: obj['power_state']
            },
            success:function (data) {
                drawVMStatus(obj['row_id'], obj['vm_id'], obj['power_state']);
            }
          });
    });
}

$(document).ready(function(){
    $('#OpenstackEditVmButton').click(function() {
        $.ajax({
                type : 'POST',
                url : 'vm_update.php',
                data: {
                    vm: $('#vm').val(),
                    machine_type: $('#machine_type').val(),
                    os_type: $('#os_type').val(),
                    source_volume: $('#source_volume').val(),
                },
                success:function (data) {
                    reloadOpenStackVmTable();
                    $('#modalWm').modal('toggle');
                }
        });
    });
    $('#main_table').on("click", "a.power-button", function() { //since table items are dynamically generated, we will not get ordinary .click() event
        var vm_array=[];
        vm_array.push({
            vm_id : $(this).attr('id'),
            power_state : $(this).attr('data-power'),
            row_id : $(this).attr('data-power-button-rowid'),
        });
        vmPowerCycle(vm_array);
    });
})