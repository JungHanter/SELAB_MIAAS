__author__ = 'hanter'

from django.conf.urls import url
from . import views, apis

app_name = 'miaas'
urlpatterns = [
    # url(r'^$', views.main_page, name='main'),
    url(r'^$', views.index_page, name='index'),
    url(r'^main$', views.main_page, name='main'),
    # url(r'^main2$', views.main2_page, name='main2'),
    # url(r'^$', views.IndexView.as_view(), name='index'),

    url(r'^signin$', views.main_page, name='signin'),
    # url(r'^signin$', views.signin_page, name='signin'),
    url(r'^contact_us$', views.contact_us_page, name='contact_us'),
    url(r'^signup$', views.signup_page, name='signup'),
    url(r'^find$', views.find_page, name='find'),
    url(r'^profile$', views.profile_page, name='profile'),
    url(r'^physician$', views.physician_profile_page, name='physician_profile'),
    url(r'^account$', views.account_page, name='account'),

    url(r'^archive$', views.archive_page, name='archive'),
    # url(r'^archive/upload$', views.archive_upload_page, name='archive_upload'),
    url(r'^archive/upload$', views.ArchiveUploadView.as_view(), name='archive_upload'),
    # url(r'^archive/detail/(?P<image_id>[0-9]+)$', views.medical_image_page, name='archive_detail'),
    url(r'^archive/detail/(?P<image_id>[0-9]+)$', views.ArchiveDetailView.as_view(), name='archive_detail'),

    url(r'^interpretation$', views.patient_interpretation_list_page, name='interpretation'),
    url(r'^interpretation/request$', views.patient_request_list_page, name='interpretation_request_list'),
    url(r'^interpretation/request/detail/(?P<request_id>[0-9]+)$', views.patient_interpretation_request_detail_page, name='interpretation_request_detail'),
    url(r'^interpretation/(?P<intpr_id>[0-9]+)$', views.patient_interpretation_detail_page, name='interpretation_detail'),

    url(r'^interpretations$', views.physician_interpretation_page, name='physician_interpretation'),
    url(r'^interpretations/detail/(?P<intpr_id>[0-9]+)$', views.physician_interpretation_detail_page, name='physician_interpretation_detail'),
    url(r'^interpretations/response$', views.physician_interpretation_response_page, name='interpretation_response'),
    url(r'^interpretations/search$', views.physician_interpretation_search, name='interpretation_search'),
    url(r'^interpretations/search/detail/(?P<request_id>[0-9]+)$', views.physician_request_search_detail_page, name='interpretation_search_detail'),
    url(r'^interpretations/write/(?P<request_id>[0-9]+)$', views.physician_interpretation_write, name='interpretation_write'),

    # url(r'^opinion/(?P<opinion_id>[0-9]+)/$', views.opinion, name='opinion'),
    # url(r'^user/(?P<user_name>[ a-zA-Z_-]+)/$', views.user, name='user'),
    # url(r'^template$', views.template, name='template'),

    # url(r'^test$', views.test_page, name='test'),
    url(r'^test$', views.UploadViewTest.as_view(), name='test'),


    ### for APIs ###
    url(r'^api/sessions$', apis.handle_session_mgt),
    url(r'^api/intpr_session$', apis.handle_intpr_session_mgt),
    url(r'^api/user$', apis.handle_user_mgt),
    url(r'^api/patient_profile$', apis.handle_patient_profile_mgt),
    url(r'^api/physician_profile$', apis.handle_physician_profile_mgt),
    url(r'^api/medical_image$', apis.handle_medical_image_mgt),
    url(r'^api/interpretation$', apis.handle_interpretation_mgt),
    url(r'^api/analytics$', apis.handle_analytics_mgt),
    url(r'^api/payment$', apis.handle_payment_mgt),
    url(r'^api/get_upload_progress$', apis.handle_image_uploading_progress),
    url(r'^api/image_upload$', apis.handle_multple_image_upload),

    url(r'^api/archive$', apis.handle_archive),

    url(r'^api/test$', apis.handle_test),
    url(r'^json_res/success$', views.json_response_success),

    url(r'^auth/(?P<user_id>[-._a-z0-9]+)/(?P<auth_code>[a-zA-Z0-9]+)$', views.auth_email_page, name='auth_email'),
    url(r'^auth/update/(?P<user_id>[-._a-z0-9]+)/(?P<auth_code>[a-zA-Z0-9]+)$', views.auth_change_email_page, name='auth_email_update'),

    url(r'^', views.page_not_found_view)
]