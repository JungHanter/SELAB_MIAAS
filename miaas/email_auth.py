from django.core.mail import send_mail
from django.conf import settings
from django.core.urlresolvers import reverse
from django.template.loader import render_to_string
import string, random, logging
import cloud_db
# mail install http://greenyant.blogspot.kr/2015/06/django-email.html
# MAC: sudo postfix start
# LINux: sudo apt-get install sendmail


logging.basicConfig(
    format="[%(name)s][%(asctime)s] %(message)s",
    handlers=[logging.StreamHandler()],
    level=logging.INFO
)
logger = logging.getLogger(__name__)

def get_auth_link(user_id, auth_code):
    return settings.DOMAIN_ADDRESS + reverse('miaas:auth_email', kwargs={'user_id': user_id, 'auth_code': auth_code})


def generate_auth_code():
    return ''.join(random.SystemRandom().choice(string.ascii_letters + string.digits) for _ in range(30))


def send_auth_mail(user_info, auth_code):
    auth_link = get_auth_link(user_info['user_id'], auth_code)

    template_plain = render_to_string('miaas/auth_mail.txt', {'user': user_info, 'auth_link': auth_link})
    template_html = render_to_string('miaas/auth_mail.html', {'user': user_info, 'auth_link': auth_link})

    send_mail('MIAAS - Email Authentication Request', template_plain, settings.EMAIL_DEFAULT_FROM,
              [user_info['email']], fail_silently=False, html_message=template_html)


def verify_auth_mail(user_id, auth_code):
    try:
        db = cloud_db.DbManager()
        deleted = db.delete_authentication(user_id, auth_code)
        return deleted
    except Exception as e:
        logger.exception(e)
        return False
