$(document).ready(function() {
  var sending_request = false;

  $('.dropdown-toggle').on('click', function(e) {
    if (! sending_request) {
      sending_request = true;

      $.ajax({
        type: 'GET',
        url: `/api/v1/job/`,
      }).done(function(data){
        var container = $('.job-container');

        /* clear loading image */
        $('.job-loading').remove();

        if (data['result'].length == 0) {
          container.append(`<a class='dropdown-item job-status-nothing' href='#'>実行タスクなし</a>`);
        }

        for (let jobinfo of data['result']) {
          let operation = '';
          /*
           * The reason why getting modulo of specified operation type is that
           * considering to the customized operation-type which might be defined in CustomView.
           *
           * When an user who develops Custom View defines custom operation type, it might be
           * required to be handled as a basic one. In this case, user could declare it with an
           * identifier which is greater than 100 (A hundred could be enough number to be able to
           * identify basic operation types).
           */
          let operation_type = jobinfo['operation'] % 100;
          let target_name = '';
          switch(operation_type) {
            case data['constant']['operation']['create']:
            case data['constant']['operation']['create_entity']:
              target_name = jobinfo['target']['name'];
              operation = '作成';
              break;
            case data['constant']['operation']['edit']:
            case data['constant']['operation']['edit_entity']:
              target_name = jobinfo['target']['name'];
              operation = '編集';
              break;
            case data['constant']['operation']['delete']:
            case data['constant']['operation']['delete_entity']:
              target_name = jobinfo['target']['name'];
              operation = '削除';
              break;
            case data['constant']['operation']['copy']:
            case data['constant']['operation']['do_copy']:
              target_name = jobinfo['target']['name'];
              operation = 'コピー';
              break;
            case data['constant']['operation']['import']:
            case data['constant']['operation']['import_v2']:
              target_name = jobinfo['target']['name'];
              operation = 'インポート';
              break;
            case data['constant']['operation']['export']:
            case data['constant']['operation']['export_search_result']:
              operation = 'エクスポート';
              break;
            case data['constant']['operation']['restore']:
              target_name = jobinfo['target']['name'];
              operation = '復旧';
              break;
          }

          switch(jobinfo['status']) {
            case data['constant']['status']['processing']:
              container.append(`<li class='dropdown-item job-status-processing' href='#'>[処理中/${operation}] ${ target_name }</li>`);
              break;
            case data['constant']['status']['done']:
              var link_url = null;
              switch(operation_type) {
                case data['constant']['operation']['import']:
                  // The case of import job, target-id indicates Entity-ID
                  link_url = `/entry/${ jobinfo['target']['id'] }`;
                  break;
                case data['constant']['operation']['export']:
                case data['constant']['operation']['export_search_result']:
                  // The case of export job, it has no target
                  link_url = `/job/download/${ jobinfo['id'] }`;
                  break;
                case data['constant']['operation']['create_entity']:
                case data['constant']['operation']['edit_entity']:
                case data['constant']['operation']['delete_entity']:
                  if (jobinfo['target']['is_active']){
                    // This indicates Entity-ID
                    link_url = `/entry/${ jobinfo['target']['id'] }`;
                  } else {
                    // Prevent to enter a deleted entity
                    link_url = null;
                  }
                  break;
                default:
                  // This indicates Entry-ID by default
                  link_url = `/entry/show/${ jobinfo['target']['id'] }`;
              }

              if (link_url !== null) {
                container.append(`<a class='dropdown-item job-status-done' href="${ link_url }">[完了/${operation}] ${ target_name }</a>`);
              } else {
                container.append(`<li class='dropdown-item' href='#'>[完了/${operation}] ${ target_name }</li>`);
              }

              break;
            case data['constant']['status']['error']:
              container.append(`<a class='dropdown-item job-status-error' href='#'>[エラー/${operation}] ${ target_name }</a>`);
              break;
            case data['constant']['status']['timeout']:
              container.append(`<a class='dropdown-item job-status-timeout' href='#'>[タイムアウト/${operation}] ${ target_name }</a>`);
              break;
          }
        }

      }).fail(function(data){
        MessageBox.error('failed to load data from server (Please reload this page or call Administrator)');
      });
    }
  });
});
