import logging

import pymysql

logging.basicConfig(
    format="[%(name)s][%(asctime)s] %(message)s",
    handlers=[logging.StreamHandler()],
    level=logging.INFO
)
logger = logging.getLogger(__name__)


class DbManager:
    INTPR_COLUMNS = ["intpr_id", "patient_id", "physician_id", 'image_id', 'level', "fee", "interpret_date",
                     "summary", "request_id", "suspected_disease", "opinion", "recommendation"]
    IMAGE_COLUMNS = ["image_id", "patient_id", "image_subject", "image_type", "taken_from", "physician", "place",
                     "description", "image_dir", "size", "upload_date", "intpr_num", "taken_date", "medical_department"]
    REQUEST_COLUMNS = ["request_id", "image_id", "status", "request_subject", "request_message", "request_date",
                       "level"]
    RESPONSE_COLUMNS = ["request_id", "physician_id", "response_message", "response_date"]
    PHYSICIAN_COLUMNS = ['user_id', 'physician_name', 'license_number', 'medicine_field', 'certificate_dir',
                         'phone_number', 'email', 'join_date', 'deactivate_date']
    PATIENT_COLUMNS = ['user_id', 'patient_name', 'gender', 'birthday',
                       'phone_number', 'email', 'join_date', 'deactivate_date']

    PATIENT_IMAGE_LIST = "patient_image_list"
    PATIENT_INTPR_LIST = "patient_intpr_list"
    PATIENT_REQUEST_LIST = "patient_request_list"
    PHYSICIAN_SEARCH_REQUEST_LIST = "physician_search_request_list"
    PHYSICIAN_RESPONSE_LIST = "physician_response_list"
    PHYSICIAN_INTPR_LIST = "physician_intpr_list"
    REQUEST_RESPONSE_LIST = "request_response_list"
    IMAGE_INTPR_LIST = "image_intpr_list"

    PATIENT_INTPR_DETAIL = "patient_intpr_detail"
    PATIENT_REQUEST_DETAIL = "patient_request_detail"
    PATIENT_IMAGE_DETAIL = "patient_image_detail"
    PHYSICIAN_INTPR_DETAIL = "physician_intpr_detail"
    PHYSICIAN_REQUEST_DETAIL = "physician_request_detail"

    def __init__(self):
        host = 'rainbowdb.czg2t6iatylv.us-west-2.rds.amazonaws.com'
        user = 'smartylab'
        port = 3306
        password = 'lovejesus'
        dbName = 'miaas'
        try:
            self.connector = pymysql.connect(host=host, port=port, user=user, passwd=password, db=dbName,
                                             charset='utf8')
            self.is_connected = True
        except Exception as e:
            logger.exception(e)
            raise Exception("DB Connection Error" + e.message)
            self.is_connected = False

    RETRIEVE_LIST_QUERY = {
        PATIENT_IMAGE_LIST:
            {
                "query": "SELECT timestamp, subject, image_type, taken_date, intpr_num, image_id "
                         "FROM miaas.medical_image "
                         "WHERE user_id = %s;",
                "columns": ["uploaded_date", "image_subject", "image_type", "recorded_date", "intpr_num",
                            "image_id"]},

        PATIENT_INTPR_LIST:
            {
                "query": "SELECT req.timestamp, intpr.timestamp, req.subject, m.subject, m.image_type, req.level, intpr.intpr_id " \
                         "FROM interpretation intpr " \
                         "JOIN request req ON intpr.request_id = req.request_id " \
                         "JOIN medical_image m ON intpr.image_id = m.image_id " \
                         "WHERE intpr.patient_id= %s " \
                         "ORDER BY intpr.timestamp DESC",
                "columns": ["request_date", "interpret_date", "request_subject", "image_subject",
                            "image_type", "level", "intpr_id"]},

        PATIENT_REQUEST_LIST:
            {
                "query": "SELECT req.timestamp, req.subject, m.subject, m.image_type, req.level, req.status, req.request_id "
                         "FROM miaas.request req " \
                         "JOIN miaas.medical_image m ON req.image_id = m.image_id " \
                         "WHERE m.user_id=%s and req.status > 0 " \
                         "ORDER BY req.timestamp DESC",
                "columns": ["request_date", "request_subject", "image_subject", "image_type", "level",
                            "status", "request_id"]},

        PHYSICIAN_SEARCH_REQUEST_LIST:
            {
                "query": "SELECT req.timestamp, m.user_id, req.subject, m.subject, m.image_type, req.level, req.request_id  " \
                         "FROM request req " \
                         "JOIN medical_image m on req.image_id = m.image_id " \
                         "WHERE status >= 2 and %s NOT IN(SELECT physician_id FROM response res WHERE req.request_id=res.request_id) " \
                         "ORDER BY req.timestamp DESC",
                "columns": ["request_date", "patient_id", "request_subject", "image_subject", "image_type",
                            "level", "request_id"]},

        PHYSICIAN_RESPONSE_LIST:
            {
                "query": "SELECT  req.timestamp, res.timestamp, m.user_id, req.subject, " \
                         "m.subject, m.image_type, req.level, req.status, req.request_id " \
                         "FROM response res " \
                         "JOIN request req on res.request_id = req.request_id " \
                         "JOIN medical_image m on req.image_id = m.image_id  " \
                         "WHERE res.physician_id = %s and req.status > 0 " \
                         "ORDER BY " \
                         "CASE " \
                         "WHEN req.status = 1 Then 3 " \
                         "WHEN req.status = 2 Then 2 " \
                         "WHEN req.status = 0 Then 0 " \
                         "END DESC",
                "columns": ["request_date", "response_date", "patient_id", "request_subject",
                            "image_subject", "image_type", "level", "status", "request_id"]},

        PHYSICIAN_INTPR_LIST:
            {
                "query": "SELECT req.timestamp, intpr.timestamp, m.user_id, m.subject, " \
                         "m.image_type, req.level, intpr.intpr_id " \
                         "FROM interpretation intpr " \
                         "JOIN request req ON intpr.request_id = req.request_id " \
                         "JOIN medical_image m ON intpr.image_id = m.image_id " \
                         "WHERE intpr.physician_id= %s " \
                         "ORDER BY intpr.timestamp DESC",

                "columns": ["request_date", "interpret_date", "patient_id", "image_subject",
                            "image_type", "level", "intpr_id"]},
        REQUEST_RESPONSE_LIST:
            {
                "query": "SELECT phi.user_id, phi.name, phi.medicine_field, phi.phone_number, phi.email, res.message " \
                         "FROM response res " \
                         "JOIN physician_info phi ON res.physician_id = phi.user_id " \
                         "WHERE res.request_id=%s",

                "columns": ["physician_id", "physician_name", "medical_field", "phone_number", 'email',
                            "response_message"]},
        IMAGE_INTPR_LIST:
            {
                "query": "SELECT intpr.*" \
                         "FROM interpretation intpr " \
                         "WHERE image_id=%s",

                "columns": INTPR_COLUMNS}
    }

    RETRIEVE_DETAIL_QUERY = {
        PATIENT_INTPR_DETAIL:
            {
                "query": "SELECT intpr.*, phi.*, req.*, m.* "
                         "FROM interpretation intpr "
                         "JOIN physician_info phi ON intpr.physician_id = phi.user_id "
                         "LEFT JOIN request req ON intpr.request_id = req.request_id "
                         "JOIN medical_image m ON intpr.image_id = m.image_id "
                         "WHERE intpr.intpr_id = %s",

                "columns": [INTPR_COLUMNS, PHYSICIAN_COLUMNS, REQUEST_COLUMNS, IMAGE_COLUMNS]},

        PATIENT_REQUEST_DETAIL:
            {
                "query": "SELECT req.*, m.*  "
                         "FROM request req "
                         "JOIN medical_image m ON req.image_id = m.image_id "
                         "WHERE req.request_id = %s;",

                "columns": [REQUEST_COLUMNS, IMAGE_COLUMNS]},

        PATIENT_IMAGE_DETAIL:
            {
                "query": "SELECT * "
                         "FROM medical_image "
                         "WHERE image_id=%s",
                "columns": [IMAGE_COLUMNS]},

        PHYSICIAN_INTPR_DETAIL:
            {"query": "SELECT intpr.*, phi.*, pai.*, req.*, m.* "
                      "FROM interpretation intpr "
                      "JOIN physician_info phi ON intpr.physician_id = phi.user_id "
                      "JOIN patient_info pai ON intpr.patient_id = pai.user_id "
                      "JOIN request req ON intpr.request_id = req.request_id "
                      "JOIN medical_image m ON intpr.image_id = m.image_id "
                      "WHERE intpr.intpr_id = %s",

             "columns": [INTPR_COLUMNS, PHYSICIAN_COLUMNS, PATIENT_COLUMNS, REQUEST_COLUMNS, IMAGE_COLUMNS]},

        PHYSICIAN_REQUEST_DETAIL:
            {"query": "SELECT req.*, pai.*, m.* "
                      "FROM request req "
                      "JOIN patient_info pai ON req.patient_id = pai.user_id "
                      "JOIN medical_image m ON m.image_id = req.image_id "
                      "WHERE req.request_id = %s",

             "columns": [REQUEST_COLUMNS, PATIENT_COLUMNS, IMAGE_COLUMNS]}
    }

    def retrieve_list(self, query_type, *args):
        result = []
        with self.connector.cursor() as cursor:
            try:
                cursor.execute(self.RETRIEVE_LIST_QUERY[query_type]['query'], args)
                for rows in cursor:
                    temp = {}
                    for key, r in zip(self.RETRIEVE_LIST_QUERY[query_type]['columns'], rows):
                        temp[key] = r
                    result.append(temp)

            except Exception as e:
                print self.RETRIEVE_LIST_QUERY[query_type]['query']% args
                logger.exception(e)
                raise Exception(query_type + " Error :" + e.message)

        return result

    def retrieve_detail(self, query_type, *args):
        result = []
        with self.connector.cursor() as cursor:
            try:
                cursor.execute(self.RETRIEVE_DETAIL_QUERY[query_type]['query'], args)
                row = cursor.fetchone()
                row_idx = 0
                for columns in self.RETRIEVE_DETAIL_QUERY[query_type]['columns']:
                    temp = {}
                    for key in columns:
                        temp[key] = row[row_idx]
                        row_idx += 1
                    result.append(temp)
            except Exception as e:
                logger.exception(e)
                raise Exception(query_type + " Error :" + e.message)

        return result


if __name__ == '__main__':
    db = DbManager()
    # responses = db.retrieve_list(db.REQUEST_RESPONSE_LIST, 211)
    image, = db.retrieve_detail(db.PATIENT_IMAGE_DETAIL, 211)
    intprs = db.retrieve_list(db.IMAGE_INTPR_LIST, image['image_id'])

    # print image
    print len(intprs)