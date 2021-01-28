from collections.abc import Iterable
from datetime import datetime, date

from django.db import models
from django.db.models import Q
from django.core.cache import cache
from django.conf import settings

from entity.models import EntityAttr, Entity
from user.models import User
from group.models import Group

from acl.models import ACLBase
from airone.lib.acl import ACLObjType, ACLType
from airone.lib.types import AttrTypeStr, AttrTypeObj, AttrTypeText
from airone.lib.types import AttrTypeArrStr, AttrTypeArrObj
from airone.lib.types import AttrTypeValue
from airone.lib.elasticsearch import (
    ESS, make_query, execute_query, make_search_results, is_date_check)
from airone.lib import auto_complement

from .settings import CONFIG


class AttributeValue(models.Model):
    # This is a constant that indicates target object binds multiple AttributeValue objects.
    STATUS_DATA_ARRAY_PARENT = 1 << 0

    MAXIMUM_VALUE_SIZE = (1 << 16)

    value = models.TextField()
    referral = models.ForeignKey(ACLBase, null=True, related_name='referred_attr_value')
    data_array = models.ManyToManyField('AttributeValue')
    created_time = models.DateTimeField(auto_now_add=True)
    created_user = models.ForeignKey(User)
    parent_attr = models.ForeignKey('Attribute')
    status = models.IntegerField(default=0)
    boolean = models.BooleanField(default=False)
    date = models.DateField(null=True)

    # This parameter means that target AttributeValue is the latest one. This is usefull to
    # find out enabled AttributeValues by Attribute or EntityAttr object. And separating this
    # parameter from status is very meaningful to reduce query at clearing this flag (If this
    # flag is a value of status paramete, you have to send at least two query to set it down,
    # because you have to check current value by SELECT, after that you calculate new value
    # then update it).
    is_latest = models.BooleanField(default=True)

    # The reason why the 'data_type' parameter is also needed in addition to the Attribute is that
    # the value of 'type' in Attribute may be changed dynamically.
    #
    # If that value is changed after making AttributeValue, we can't know the old type of Attribute.
    # So it's necessary to save the value of AttrTypeVelue for each AttributeValue instance.
    # And this value is constract, this parameter will never be changed after creating.
    data_type = models.IntegerField(default=0)

    # This indicates the parent AttributeValue object, this parameter is usefull to identify
    # leaf AttriuteValue objects.
    parent_attrv = models.ForeignKey('AttributeValue', null=True, related_name='child')

    def set_status(self, val):
        self.status |= val
        self.save()

    def del_status(self, val):
        self.status &= ~val
        self.save()

    def get_status(self, val):
        return self.status & val

    def clone(self, user, **extra_params):
        cloned_value = AttributeValue.objects.get(id=self.id)

        # By removing the primary key, we can clone a django model instance
        cloned_value.pk = None

        # set extra configure
        for (k, v) in extra_params.items():
            setattr(cloned_value, k, v)

        # update basic parameters to new one
        cloned_value.created_user = user
        cloned_value.created_time = datetime.now()
        cloned_value.save()

        cloned_value.data_array.clear()

        return cloned_value

    def get_value(self, with_metainfo=False):
        """
        This returns registered value according to the type of Attribute
        """
        def _get_named_value(attrv):
            if attrv.referral and attrv.referral.is_active:
                if with_metainfo:
                    return {attrv.value: {'id': attrv.referral.id, 'name': attrv.referral.name}}
                else:
                    return {attrv.value: attrv.referral.name}
            else:
                return {attrv.value: None}

        def _get_object_value(attrv):
            if attrv.referral and attrv.referral.is_active:
                if with_metainfo:
                    return {'id': attrv.referral.id, 'name': attrv.referral.name}
                else:
                    return attrv.referral.name

        def _get_group_value(attrv):
            group = Group.objects.filter(id=attrv.value, is_active=True)
            if not group:
                return None
            else:
                group = group.first()

            if with_metainfo:
                return {'id': group.id, 'name': group.name}
            else:
                return group.name

        value = None
        if (self.parent_attr.schema.type == AttrTypeValue['string'] or
                self.parent_attr.schema.type == AttrTypeValue['text']):
            value = self.value

        elif self.parent_attr.schema.type == AttrTypeValue['boolean']:
            value = self.boolean

        elif self.parent_attr.schema.type == AttrTypeValue['date']:
            value = self.date

        elif self.parent_attr.schema.type == AttrTypeValue['object']:
            value = _get_object_value(self)

        elif self.parent_attr.schema.type == AttrTypeValue['named_object']:
            value = _get_named_value(self)

        elif self.parent_attr.schema.type == AttrTypeValue['group'] and self.value:
            value = _get_group_value(self)

        elif self.parent_attr.schema.type & AttrTypeValue['array']:
            if self.parent_attr.schema.type & AttrTypeValue['named']:
                value = [_get_named_value(x) for x in self.data_array.all()]

            elif self.parent_attr.schema.type & AttrTypeValue['string']:
                value = [x.value for x in self.data_array.all()]

            elif self.parent_attr.schema.type & AttrTypeValue['object']:
                value = [_get_object_value(x) for x in self.data_array.all() if x.referral]

            elif self.parent_attr.schema.type & AttrTypeValue['group']:
                value = [x for x in [_get_group_value(y) for y in self.data_array.all()] if x]

        if with_metainfo:
            value = {'type': self.parent_attr.schema.type, 'value': value}

        return value

    def format_for_history(self):
        def _get_group_value(attrv):
            return Group.objects.filter(id=attrv.value, is_active=True).first()

        if not self.data_type:
            # complement data_type as the current type of Attribute
            self.data_type = self.parent_attr.schema.type
            self.save()

        if self.data_type == AttrTypeValue['array_string']:
            return [x.value for x in self.data_array.all()]
        elif self.data_type == AttrTypeValue['array_object']:
            return [x.referral for x in self.data_array.all()]
        elif self.data_type == AttrTypeValue['object']:
            return self.referral
        elif self.data_type == AttrTypeValue['boolean']:
            return self.boolean
        elif self.data_type == AttrTypeValue['date']:
            return self.date
        elif self.data_type == AttrTypeValue['named_object']:
            return {
                'value': self.value,
                'referral': self.referral,
            }
        elif self.data_type == AttrTypeValue['array_named_object']:
            return sorted([{
                'value': x.value,
                'referral': x.referral,
            } for x in self.data_array.all()], key=lambda x: x['value'])

        elif self.data_type == AttrTypeValue['group'] and self.value:
            return _get_group_value(self)

        elif self.data_type == AttrTypeValue['array_group']:
            return [y for y in [_get_group_value(x) for x in self.data_array.all()] if y]

        else:
            return self.value

    @classmethod
    def search(kls, query):
        results = []
        for obj in kls.objects.filter(value__icontains=query):
            attr = obj.parent_attr
            entry = attr.parent_entry

            results.append({
                'type': entry.__class__.__name__,
                'object': entry,
                'hint': "attribute '%s' has '%s'" % (attr.name, obj.value)
            })

        return results

    @classmethod
    def create(kls, user, attr, **params):
        return kls.objects.create(created_user=user,
                                  parent_attr=attr,
                                  data_type=attr.schema.type,
                                  **params)

    # These are helper methods that chnages input value to storable value for each
    # data type (e.g. case group type, this allows Group instance and int and str
    # value that indicate specific group instance, and it returns id of its instance)
    @classmethod
    def uniform_storable_for_group(kls, val):
        """
        This converts input to group id value(str) to be able to store at AttributeValue.
        And this expects input value as Group type instance, int value that indicate
        ID of specific Group instance and name(str) value of specific Group instance.
        """
        obj_group = None
        if isinstance(val, Group) and val.is_active:
            obj_group = val

        elif isinstance(val, str):
            if val.isdigit():
                obj_group = Group.objects.filter(id=val, is_active=True).first()
            else:
                obj_group = Group.objects.filter(name=val, is_active=True).first()

        elif isinstance(val, int):
            obj_group = Group.objects.filter(id=val, is_active=True).first()

        # when value is invalid value (e.g. False, empty string) set 0
        # not to cause ValueError exception at other retrieval processing.
        return str(obj_group.id) if obj_group else ''


class Attribute(ACLBase):
    values = models.ManyToManyField(AttributeValue)

    # This parameter is needed to make a relationship with corresponding EntityAttr
    schema = models.ForeignKey(EntityAttr)
    parent_entry = models.ForeignKey('Entry')

    def __init__(self, *args, **kwargs):
        super(Attribute, self).__init__(*args, **kwargs)
        self.objtype = ACLObjType.EntryAttr

    # This checks whether each specified attribute needs to update
    def is_updated(self, recv_value):
        # the case new attribute-value is specified
        if not self.values.exists():
            # the result depends on the specified value
            if isinstance(recv_value, bool):
                # the case that first value is 'False' at the boolean typed parameter
                return True
            else:
                return recv_value

        last_value = self.values.last()
        if self.schema.type == AttrTypeStr or self.schema.type == AttrTypeText:
            # the case that specified value is empty or invalid
            if not recv_value:
                # Value would be changed as empty when there is valid value
                # in the latest AttributeValue
                return last_value.value
            else:
                return last_value.value != recv_value

        elif self.schema.type == AttrTypeObj:
            # formalize recv_value type
            if isinstance(recv_value, Entry):
                recv_value = recv_value.id
            elif recv_value and isinstance(recv_value, str):
                recv_value = int(recv_value)

            if not last_value.referral and not recv_value:
                return False
            elif last_value.referral and not recv_value:
                return True
            elif not last_value.referral and recv_value:
                return True
            elif last_value.referral.id != recv_value:
                return True

        elif self.schema.type == AttrTypeArrStr:
            # the case that specified value is empty or invalid
            if not recv_value:
                # Value would be changed as empty when there are any values
                # in the latest AttributeValue
                return last_value.data_array.count() > 0

            # the case of changing value
            if last_value.data_array.count() != len(recv_value):
                return True
            # the case of appending or deleting
            for value in recv_value:
                if not last_value.data_array.filter(value=value).exists():
                    return True

        elif self.schema.type == AttrTypeArrObj:
            # the case that specified value is empty or invalid
            if not recv_value:
                # Value would be changed as empty when there are any values
                # in the latest AttributeValue
                return last_value.data_array.count() > 0

            # the case of changing value
            if last_value.data_array.count() != len(recv_value):
                return True

            # the case of appending or deleting
            for value in recv_value:
                # formalize value type
                if isinstance(value, Entry):
                    value = value.id

                if not last_value.data_array.filter(referral__id=value).exists():
                    return True

        elif self.schema.type == AttrTypeValue['boolean']:
            return last_value.boolean != bool(recv_value)

        elif self.schema.type == AttrTypeValue['group']:
            return last_value.value != AttributeValue.uniform_storable_for_group(recv_value)

        elif self.schema.type == AttrTypeValue['date']:
            return last_value.date != recv_value

        elif self.schema.type == AttrTypeValue['named_object']:
            # the case that specified value is empty or invalid
            if not recv_value:
                # Value would be changed as empty when there is valid value
                # in the latest AttributeValue
                return last_value.value or (last_value.referral and last_value.referral.is_active)

            if last_value.value != recv_value['name']:
                return True

            # formalize recv_value['id'] type
            if isinstance(recv_value['id'], Entry):
                recv_value['id'] = recv_value['id'].id

            if not last_value.referral and recv_value['id']:
                return True

            if (last_value.referral and recv_value['id'] and
                    last_value.referral.id != int(recv_value['id'])):
                return True

        elif self.schema.type == AttrTypeValue['array_named_object']:
            def get_entry_id(value):
                if isinstance(value, Entry):
                    return value.id
                elif isinstance(value, str):
                    return int(value)
                else:
                    return value

            # the case that specified value is empty or invalid
            if not recv_value:
                # Value would be changed as empty
                # when there are any values in the latest AttributeValue
                return last_value.data_array.count() > 0

            cmp_curr = []
            for co_attrv in last_value.data_array.all():
                if co_attrv.referral:
                    cmp_curr.append('%s-%s' % (co_attrv.referral.id, co_attrv.value))
                else:
                    cmp_curr.append('N-%s' % (co_attrv.value))

            cmp_recv = []
            for info in recv_value:
                name = info['name'] if 'name' in info and info['name'] else ''

                if 'id' in info and info['id']:
                    cmp_recv.append('%s-%s' % (get_entry_id(info['id']), name))
                else:
                    cmp_recv.append('N-%s' % (name))

            if sorted(cmp_curr) != sorted(cmp_recv):
                return True

        elif self.schema.type == AttrTypeValue['array_group']:
            # This is the case when input value is None, this returns True when
            # any available values are already exists.
            if not recv_value:
                return any([
                    Group.objects.filter(id=x.value, is_active=True).exists()
                    for x in last_value.data_array.all()
                ])

            return (
                sorted([
                    AttributeValue.uniform_storable_for_group(v)
                    for v in recv_value if v]) !=
                sorted([
                    x.value for x in last_value.data_array.all()
                    if Group.objects.filter(id=x.value, is_active=True).exists()
                ])
            )

        return False

    # These are helper funcitons to get differental AttributeValue(s) by an update request.
    def _validate_attr_values_of_array(self):
        if not int(self.schema.type) & AttrTypeValue['array']:
            return False
        return True

    def get_values(self, where_extra=[]):
        where_cond = [] + where_extra

        if self.schema.type & AttrTypeValue['array']:
            where_cond.append('status & %d > 0' % AttributeValue.STATUS_DATA_ARRAY_PARENT)
        else:
            where_cond.append('status & %d = 0' % AttributeValue.STATUS_DATA_ARRAY_PARENT)

        return self.values.extra(where=where_cond).order_by('created_time')

    def get_latest_values(self):
        params = {
            'where_extra': ['is_latest > 0'],
        }
        return self.get_values(**params)

    def get_latest_value(self):
        def _create_new_value():
            params = {
                'value': '',
                'created_user': self.created_user,
                'parent_attr': self,
                'data_type': self.schema.type,
                'status': 0,
            }
            if self.schema.type & AttrTypeValue['array']:
                params['status'] |= AttributeValue.STATUS_DATA_ARRAY_PARENT

            attrv = AttributeValue.objects.create(**params)
            self.values.add(attrv)

            return attrv

        attrv = self.values.filter(is_latest=True).last()
        if attrv:
            # When a type of attribute value is clear, a new Attribute value will be created
            if attrv.data_type != self.schema.type:
                return _create_new_value()
            else:
                return attrv

        elif self.values.count() > 0:
            # During the processing of updating attribute-value, a short period of time
            # that the latest attribute value is vanished might happen. This condition
            # prevents creating new blank AttributeValue when user get latest-value of
            # this Attribute at that time.
            attrv = self.values.last()

            # When a type of attribute value is clear, a new Attribute value will be created
            if attrv.data_type != self.schema.type:
                return _create_new_value()
            else:
                return attrv

        else:
            return _create_new_value()

    def get_last_value(self):
        attrv = self.values.last()
        if not attrv:
            attrv = AttributeValue.objects.create(**{
                'value': '',
                'created_user': self.created_user,
                'parent_attr': self,
                'status': 1 if self.schema.type & AttrTypeValue['group'] else 0,
                'data_type': self.schema.type,
            })
            self.values.add(attrv)

        return attrv

    def clone(self, user, **extra_params):
        if (not user.has_permission(self, ACLType.Readable) or
                not user.has_permission(self.schema, ACLType.Readable)):
            return None

        # We can't clone an instance by the way (.pk=None and save) like AttributeValue,
        # since the subclass instance refers to the parent_link's primary key during save.
        params = {
            'name': self.name,
            'created_user': user,
            'schema': self.schema,
            'parent_entry': self.parent_entry,
        }
        params.update(extra_params)
        cloned_attr = Attribute.objects.create(**params)

        attrv = self.get_latest_value()
        if attrv:
            new_attrv = attrv.clone(user, parent_attr=cloned_attr)

            # When the Attribute is array, this method also clone co-AttributeValues
            if self.schema.type & AttrTypeValue['array']:
                for co_attrv in attrv.data_array.all():
                    new_attrv.data_array.add(co_attrv.clone(user))

            cloned_attr.values.add(new_attrv)

        return cloned_attr

    def unset_latest_flag(self):
        AttributeValue.objects.filter(parent_attr=self,
                                      is_latest=True).update(is_latest=False)

    def _validate_value(self, value):
        def _is_group_object(val):
            return isinstance(val, Group) or isinstance(val, int) or isinstance(val, str) or not val

        if self.schema.type & AttrTypeValue['array']:
            if value is None:
                return True

            if(self.schema.type & AttrTypeValue['named']):
                return all([x for x in value if isinstance(x, dict) or
                            isinstance(x, type({}.values()))])

            if(self.schema.type & AttrTypeValue['object']):
                return all([isinstance(x, str) or isinstance(x, int) or isinstance(x, Entry) or
                            x is None for x in value])

            if self.schema.type & AttrTypeValue['string']:
                return True

            if self.schema.type & AttrTypeValue['group']:
                return all([_is_group_object(x) for x in value])

        if(self.schema.type & AttrTypeValue['named']):
            return isinstance(value, dict)

        if(self.schema.type & AttrTypeValue['string'] or self.schema.type & AttrTypeValue['text']):
            return True

        if(self.schema.type & AttrTypeValue['object']):
            return (isinstance(value, str) or isinstance(value, int) or isinstance(value, Entry) or
                    value is None)

        if(self.schema.type & AttrTypeValue['boolean']):
            return isinstance(value, bool)

        if(self.schema.type & AttrTypeValue['date']):
            try:
                return (isinstance(value, date) or
                        (isinstance(value, str) and
                        isinstance(datetime.strptime(value, '%Y-%m-%d'), date)) or
                        value is None)
            except ValueError:
                return False

        if(self.schema.type & AttrTypeValue['group']):
            return _is_group_object(value)

        return False

    def add_value(self, user, value, boolean=False):
        """This method make AttributeValue and set it as the latest one"""

        # This is a helper method to set AttributeType
        def _set_attrv(attr_type, val, attrv=None, params={}):
            if not attrv:
                attrv = AttributeValue(**params)

            # set attribute value according to the attribute-type
            if attr_type == AttrTypeValue['string'] or attr_type == AttrTypeValue['text']:
                attrv.boolean = boolean
                attrv.value = str(val)
                if not attrv.value:
                    return None

            if attr_type == AttrTypeValue['group']:
                attrv.boolean = boolean
                attrv.value = AttributeValue.uniform_storable_for_group(val)
                if not attrv.value:
                    return None

            elif attr_type == AttrTypeValue['object']:
                attrv.boolean = boolean
                # set None if the referral entry is not specified
                attrv.referral = None
                if not val:
                    pass
                elif isinstance(val, Entry):
                    attrv.referral = val
                elif isinstance(val, str) or isinstance(val, int):
                    ref_entry = Entry.objects.filter(id=val, is_active=True).first()
                    if ref_entry:
                        attrv.referral = ref_entry

                if not attrv.referral:
                    return

            elif attr_type == AttrTypeValue['boolean']:
                attrv.boolean = val

            elif attr_type == AttrTypeValue['date']:
                if isinstance(val, str):
                    attrv.date = datetime.strptime(val, '%Y-%m-%d').date()
                elif isinstance(val, date):
                    attrv.date = val

                attrv.boolean = boolean

            elif attr_type == AttrTypeValue['named_object']:
                attrv.value = val['name'] if 'name' in val else ''
                if 'boolean' in val:
                    attrv.boolean = val['boolean']
                else:
                    attrv.boolean = boolean

                attrv.referral = None
                if 'id' not in val or not val['id']:
                    pass
                elif isinstance(val['id'], str) or isinstance(val['id'], int):
                    ref_entry = Entry.objects.filter(id=val['id'], is_active=True).first()
                    if ref_entry:
                        attrv.referral = ref_entry
                elif isinstance(val['id'], Entry):
                    attrv.referral = val['id']
                else:
                    attrv.referral = None

                if not attrv.referral and not attrv.value:
                    return

            return attrv

        # checks the type of specified value is acceptable for this Attribute object
        if not self._validate_value(value):
            raise TypeError('[%s] "%s" is not acceptable [attr_type:%d]' % (
                self.schema.name, str(value), self.schema.type))

        # Clear the flag that means target AttrValues are latet from the Values
        # that are already created.
        self.unset_latest_flag()

        # Initialize AttrValue as None, because this may not created
        # according to the specified parameters.
        attr_value = AttributeValue.create(user, self)
        if self.schema.type & AttrTypeValue['array']:
            attr_value.boolean = boolean

            # set status of parent data_array
            attr_value.set_status(AttributeValue.STATUS_DATA_ARRAY_PARENT)

            if value and isinstance(value, Iterable):
                co_attrv_params = {
                    'created_user': user,
                    'parent_attr': self,
                    'data_type': self.schema.type,
                    'parent_attrv': attr_value,
                    'is_latest': False,
                    'boolean': boolean,
                }

                # create and append updated values
                attrv_bulk = []
                for v in value:
                    # set AttributeValue for each values
                    co_attrv = _set_attrv((self.schema.type & ~AttrTypeValue['array']), v,
                                          params=co_attrv_params)
                    if co_attrv:
                        attrv_bulk.append(co_attrv)

                # Create each leaf AttributeValue in bulk.
                # This processing send only one query to the DB
                # for making all AttributeValue objects.
                AttributeValue.objects.bulk_create(attrv_bulk)

                # set created leaf AttribueValues to the data_array parameter of
                # parent AttributeValue
                attr_value.data_array.add(*AttributeValue.objects.filter(parent_attrv=attr_value))

        else:
            _set_attrv(self.schema.type, value, attrv=attr_value)

        attr_value.save()

        # append new AttributeValue
        self.values.add(attr_value)

        return attr_value

    def convert_value_to_register(self, value):
        """
        This absorbs difference values according to the type of Attributes
        """

        def get_entry(schema, name):
            return Entry.objects.get(is_active=True, schema=schema, name=name)

        def is_entry(schema, name):
            return Entry.objects.filter(is_active=True, schema=schema, name=name)

        def get_named_object(data):
            (key, value) = list(data.items())[0]

            ret_value = {'name': key, 'id': None}
            if isinstance(value, ACLBase):
                ret_value['id'] = value

            elif isinstance(value, str):
                entryset = [get_entry(r, value)
                            for r in self.schema.referral.all() if is_entry(r, value)]

                if any(entryset):
                    ret_value['id'] = entryset[0]
                else:
                    ret_value['id'] = None

            return ret_value

        if (self.schema.type == AttrTypeValue['string'] or
                self.schema.type == AttrTypeValue['text']):
            return value

        elif self.schema.type == AttrTypeValue['object']:
            if isinstance(value, ACLBase):
                return value
            elif isinstance(value, str):
                entryset = [get_entry(r, value)
                            for r in self.schema.referral.all() if is_entry(r, value)]

                if any(entryset):
                    return entryset[0]

        elif self.schema.type == AttrTypeValue['group']:
            # This avoids to return 0 when invaild value is specified because
            # uniform_storable_for_group returns 0. By this check processing,
            # this returns None whe it happens.
            val = AttributeValue.uniform_storable_for_group(value)
            if val:
                return val

        elif self.schema.type == AttrTypeValue['boolean']:
            return value

        elif self.schema.type == AttrTypeValue['date']:
            return value

        elif self.schema.type == AttrTypeValue['named_object']:
            if not isinstance(value, dict):
                return None

            return get_named_object(value)

        elif self.schema.type & AttrTypeValue['array']:
            if not isinstance(value, list):
                return None

            if self.schema.type & AttrTypeValue['named']:
                if not all([isinstance(x, dict) for x in value]):
                    return None

                return [get_named_object(x) for x in value]

            elif self.schema.type & AttrTypeValue['string']:
                return value

            elif self.schema.type & AttrTypeValue['object']:
                return sum([[get_entry(r, v)
                           for r in self.schema.referral.all() if is_entry(r, v)]
                           for v in value], [])

            elif self.schema.type & AttrTypeValue['group']:
                return [x for x in [
                    AttributeValue.uniform_storable_for_group(y) for y in value] if x]

        return None

    def remove_from_attrv(self, user, referral=None, value=''):
        """
        This method removes target entry from specified attribute
        """
        attrv = self.get_latest_value()
        if self.schema.type & AttrTypeValue['array']:

            if self.schema.type & AttrTypeValue['named']:
                if referral is None:
                    return

                updated_data = [{
                    'name': x.value,
                    'id': x.referral.id if x.referral else None,
                    'boolean': x.boolean,
                } for x in attrv.data_array.filter(~Q(referral__id=referral.id))]

            elif self.schema.type & AttrTypeValue['string']:
                if not value:
                    return

                updated_data = [x.value for x in attrv.data_array.all() if x.value != value]

            elif self.schema.type & AttrTypeValue['object']:
                if referral is None:
                    return

                updated_data = [x.referral.id for x in attrv.data_array.all()
                                if x.referral and x.referral.id != referral.id]

            elif self.schema.type & AttrTypeValue['group']:
                if not value:
                    return

                updated_data = [
                    x.value for x in attrv.data_array.all()
                    if (x.value != AttributeValue.uniform_storable_for_group(value) and
                        Group.objects.filter(id=x.value, is_active=True).exists())
                ]

            if self.is_updated(updated_data):
                self.add_value(user, updated_data, boolean=attrv.boolean)

    def add_to_attrv(self, user, referral=None, value='', boolean=False):
        """
        This method adds target entry to specified attribute with referral_key
        """
        attrv = self.get_latest_value()
        if self.schema.type & AttrTypeValue['array']:

            updated_data = None
            if self.schema.type & AttrTypeValue['named']:
                if value or referral:
                    updated_data = [{
                        'name': x.value,
                        'boolean': x.boolean,
                        'id': x.referral.id if x.referral else None,
                    } for x in attrv.data_array.all()] + [{
                        'name': str(value),
                        'boolean': boolean,
                        'id': referral
                    }]

            elif self.schema.type & AttrTypeValue['string']:
                if value:
                    updated_data = [x.value for x in attrv.data_array.all()] + [value]

            elif self.schema.type & AttrTypeValue['object']:
                if referral:
                    updated_data = [x.referral.id for x in attrv.data_array.all()] + [referral]

            elif self.schema.type & AttrTypeValue['group']:
                group_id = AttributeValue.uniform_storable_for_group(value)
                if group_id:
                    updated_data = [x.value for x in attrv.data_array.all()] + [group_id]

            if updated_data and self.is_updated(updated_data):
                self.add_value(user, updated_data, boolean=attrv.boolean)

    def delete(self):
        super(Attribute, self).delete()

        def _may_remove_referral(referral):
            if not referral:
                # the case this refers no entry, do nothing
                return

            entry = Entry.objects.filter(id=referral.id, is_active=True).first()
            if not entry:
                # the case referred entry is already deleted, do nothing
                return

            if entry.get_referred_objects().count() > 0:
                # the case other entries also refer target referral, do nothing
                return

            entry.delete()

        # delete referral object that isn't referred from any objects if it's necessary
        if self.schema.is_delete_in_chain and self.schema.type & AttrTypeValue['object']:
            attrv = self.get_latest_value()

            if self.schema.type & AttrTypeValue['array']:
                [_may_remove_referral(x.referral) for x in attrv.data_array.all()]
            else:
                _may_remove_referral(attrv.referral)

    def restore(self):
        super(Attribute, self).restore()

        def _may_restore_referral(referral):
            if not referral:
                # the case this refers no entry, do nothing
                return

            entry = Entry.objects.filter(id=referral.id, is_active=False).first()
            if not entry:
                # the case referred entry is already restored, do nothing
                return

            entry.restore()

        # restore referral object that isn't referred from any objects if it's necessary
        if self.schema.is_delete_in_chain and self.schema.type & AttrTypeValue['object']:
            attrv = self.get_latest_value()

            if self.schema.type & AttrTypeValue['array']:
                [_may_restore_referral(x.referral) for x in attrv.data_array.all()]
            else:
                _may_restore_referral(attrv.referral)


class Entry(ACLBase):
    # This flag is set just after created or edited, then cleared at completion of the processing
    STATUS_CREATING = 1 << 0
    STATUS_EDITING = 1 << 1
    STATUS_COMPLEMENTING_ATTRS = 1 << 2

    attrs = models.ManyToManyField(Attribute)
    schema = models.ForeignKey(Entity)

    def __init__(self, *args, **kwargs):
        super(Entry, self).__init__(*args, **kwargs)
        self.objtype = ACLObjType.Entry

    def get_cache(self, cache_key):
        return cache.get("%s_%s" % (self.id, cache_key))

    def set_cache(self, cache_key, value):
        cache.set("%s_%s" % (self.id, cache_key), value)

    def clear_cache(self, cache_key):
        cache.delete("%s_%s" % (self.id, cache_key))

    def add_attribute_from_base(self, base, request_user):
        if not isinstance(base, EntityAttr):
            raise TypeError('Variable "base" is incorrect type')

        if not isinstance(request_user, User):
            raise TypeError('Variable "user" is incorrect type')

        # While an Attribute object which corresponding to base EntityAttr has been already
        # registered, a request to create same Attribute might be here when multiple request
        # invoked and make requests simultaneously. That request may call this method after
        # previous processing is finished.
        # In this case, we have to prevent to create new Attribute object.
        attr = Attribute.objects.filter(schema=base, parent_entry=self, is_active=True).first()
        if attr:
            self.may_append_attr(attr)
            return

        # This processing may avoid to run following more one time from mutiple request
        cache_key = 'add_%d' % base.id
        if self.get_cache(cache_key):
            return

        # set lock status
        self.set_cache(cache_key, 1)

        attr = Attribute.objects.create(name=base.name,
                                        schema=base,
                                        created_user=request_user,
                                        parent_entry=self,
                                        is_public=base.is_public,
                                        default_permission=base.default_permission)

        # inherits permissions of base object for user
        [[user.permissions.add(getattr(attr, permission.name))
            for permission in user.get_acls(base)]
            for user in User.objects.filter(is_active=True)]

        # inherits permissions of base object for each groups
        [[group.permissions.add(getattr(attr, permission.name))
            for permission in group.get_acls(base)]
            for group in Group.objects.all()]

        self.attrs.add(attr)

        # release lock status
        self.clear_cache(cache_key)

        return attr

    def get_referred_objects(self, entity_name=None):
        """
        This returns objects that refer current Entry in the AttributeValue
        """
        ids = AttributeValue.objects.filter(
                Q(referral=self, is_latest=True) |
                Q(referral=self, parent_attrv__is_latest=True)
                ).values_list('parent_attr__parent_entry', flat=True)

        # if entity_name param exists, add schema name to reduce filter execution time
        query = Q(pk__in=ids, is_active=True)
        if entity_name:
            query &= Q(schema__name=entity_name)

        return Entry.objects.filter(query)

    def may_append_attr(self, attr):
        """
        This appends Attribute object to attributes' array of entry when it's entitled to be there.
        """
        if (attr and attr.is_active and attr.parent_entry == self and
                attr.id not in [x.id for x in self.attrs.filter(is_active=True)]):
            self.attrs.add(attr)

    def may_remove_duplicate_attr(self, attr):
        """
        This removes speicified Attribute object if an Attribute object which refers same
        EntityAttr at schema parameter is registered to prevent saving duplicate one.
        """
        if self.attrs.filter(Q(schema=attr.schema, is_active=True), ~Q(id=attr.id)).exists():
            # remove attribute from Attribute list of this entry
            self.attrs.remove(attr)

            # update target attribute will be inactive
            attr.is_active = False
            attr.save(update_fields=['is_active'])

    def complement_attrs(self, user):
        """
        This method complements Attributes which are appended after creation of Entity
        """

        # Get auto complement user
        user = auto_complement.get_auto_complement_user(user)

        for attr_id in (set(self.schema.attrs.filter(is_active=True).values_list('id', flat=True)) -
                        set(self.attrs.filter(is_active=True).values_list('schema', flat=True))):

            entity_attr = self.schema.attrs.get(id=attr_id)
            if not user.has_permission(entity_attr, ACLType.Readable):
                continue

            newattr = self.add_attribute_from_base(entity_attr, user)
            if not newattr:
                continue

            if entity_attr.type & AttrTypeValue['array']:
                # Create a initial AttributeValue for editing processing
                attr_value = AttributeValue.objects.create(**{
                    'created_user': user,
                    'parent_attr': newattr,
                    'data_type': entity_attr.type,
                })

                # Set status of parent data_array
                attr_value.set_status(AttributeValue.STATUS_DATA_ARRAY_PARENT)

                newattr.values.add(attr_value)

            # When multiple requests to add new Attribute came here, multiple Attriutes
            # might be existed. If there were, this would delete new one.
            self.may_remove_duplicate_attr(newattr)

    def get_available_attrs(self, user, permission=ACLType.Readable, get_referral_entries=False,
                            is_active=True):
        # To avoid unnecessary DB access for caching referral entries
        ret_attrs = []
        attrs = [x for x in self.attrs.filter(is_active=is_active, schema__is_active=True)
                 if user.has_permission(x, permission)]
        for attr in sorted(attrs, key=lambda x: x.schema.index):
            attrinfo = {}

            attrinfo['id'] = attr.id
            attrinfo['name'] = attr.schema.name
            attrinfo['type'] = attr.schema.type
            attrinfo['is_mandatory'] = attr.schema.is_mandatory
            attrinfo['index'] = attr.schema.index

            # set last-value of current attributes
            attrinfo['last_value'] = ''
            if attr.values.exists():
                last_value = attr.get_latest_value()
                if not last_value.data_type:
                    last_value.data_type = attr.schema.type
                    last_value.save()

                if last_value.data_type == AttrTypeStr or last_value.data_type == AttrTypeText:
                    attrinfo['last_value'] = last_value.value

                elif last_value.data_type == AttrTypeObj:
                    if last_value.referral and last_value.referral.is_active:
                        attrinfo['last_value'] = last_value.referral
                    else:
                        attrinfo['last_value'] = None

                elif last_value.data_type == AttrTypeArrStr:
                    # this dict-key 'last_value' is uniformed with all array types
                    attrinfo['last_value'] = [x.value for x in last_value.data_array.all()]

                elif last_value.data_type == AttrTypeArrObj:
                    attrinfo['last_value'] = [x.referral for x in last_value.data_array.all()
                                              if x.referral and x.referral.is_active]

                elif last_value.data_type == AttrTypeValue['boolean']:
                    attrinfo['last_value'] = last_value.boolean

                elif last_value.data_type == AttrTypeValue['date']:
                    attrinfo['last_value'] = last_value.date

                elif last_value.data_type == AttrTypeValue['named_object']:
                    attrinfo['last_value'] = {'value': last_value.value}

                    if last_value.referral and last_value.referral.is_active:
                        attrinfo['last_value']['id'] = last_value.referral.id
                        attrinfo['last_value']['name'] = last_value.referral.name

                elif last_value.data_type == AttrTypeValue['array_named_object']:
                    values = [x.value for x in last_value.data_array.all()]
                    referrals = [x.referral for x in last_value.data_array.all()]

                    attrinfo['last_value'] = sorted([{
                        'value': v,
                        'id': r.id if r and r.is_active else None,
                        'name': r.name if r and r.is_active else None,
                    } for (v, r) in zip(values, referrals)], key=lambda x: x['value'])

                elif last_value.data_type == AttrTypeValue['group'] and last_value.value:
                    group = Group.objects.filter(id=last_value.value)
                    if group:
                        attrinfo['last_value'] = group.first()

                elif last_value.data_type == AttrTypeValue['array_group']:
                    attrinfo['last_value'] = [
                        x for x in [
                            Group.objects.filter(id=v.value, is_active=True).first()
                            for v in last_value.data_array.all()
                        ] if x
                    ]

            ret_attrs.append(attrinfo)

        return sorted(ret_attrs, key=lambda x: x['index'])

    def to_dict(self, user):
        # check permissions for each entry, entity and attrs
        if (not user.has_permission(self.schema, ACLType.Readable) or
                not user.has_permission(self, ACLType.Readable)):
            return None

        attrs = [x for x in self.attrs.filter(is_active=True, schema__is_active=True)
                 if (user.has_permission(x.schema, ACLType.Readable) and
                     user.has_permission(x, ACLType.Readable))]

        return {
            'id': self.id,
            'name': self.name,
            'entity': {
                'id': self.schema.id,
                'name': self.schema.name,
            },
            'attrs': [{
                'name': x.schema.name,
                'value': x.get_latest_value().get_value()
            } for x in attrs]
        }

    def delete(self):
        super(Entry, self).delete()

        # update Elasticsearch index info which refered this entry not to refer this link
        es_object = ESS()
        for entry in [x for x in self.get_referred_objects() if x.id != self.id]:
            entry.register_es(es=es_object)

        # also delete each attributes
        for attr in self.attrs.filter(is_active=True):

            # delete Attribute object
            attr.delete()

        if settings.ES_CONFIG:
            self.unregister_es()

    def restore(self):
        super(Entry, self).restore()

        # also restore each attributes
        for attr in self.attrs.filter(is_active=False):

            # restore Attribute object
            attr.restore()

    def clone(self, user, **extra_params):
        if (not user.has_permission(self, ACLType.Readable) or
                not user.has_permission(self.schema, ACLType.Readable)):
            return None

        # set STATUS_CREATING flag until all related parameters are set
        status = Entry.STATUS_CREATING
        if 'status' in extra_params:
            status |= extra_params.pop('status')

        # We can't clone an instance by the way (.pk=None and save) like AttributeValue,
        # since the subclass instance refers to the parent_link's primary key during save.
        params = {
            'name': self.name,
            'created_user': user,
            'schema': self.schema,
            'status': status,
        }
        params.update(extra_params)
        cloned_entry = Entry.objects.create(**params)

        for attr in self.attrs.filter(is_active=True):
            cloned_attr = attr.clone(user, parent_entry=cloned_entry)

            if cloned_attr:
                cloned_entry.attrs.add(cloned_attr)

        cloned_entry.del_status(Entry.STATUS_CREATING)
        return cloned_entry

    def export(self, user):
        attrinfo = {}

        # This calling of complement_attrs is needed to take into account the case of the Attributes
        # that are added after creating this entry.
        self.complement_attrs(user)

        for attr in self.attrs.filter(is_active=True):
            if not user.has_permission(attr, ACLType.Readable):
                continue

            latest_value = attr.get_latest_value()
            if latest_value:
                attrinfo[attr.schema.name] = latest_value.get_value()
            else:
                attrinfo[attr.schema.name] = None

        return {'name': self.name, 'attrs': attrinfo}

    def get_es_document(self, es=None):
        """This processing registers entry information to Elasticsearch"""
        # This innner method truncates value in taking multi-byte in account
        def truncate(value):
            while len(value.encode('utf-8')) > ESS.MAX_TERM_SIZE:
                value = value[:-1]
            return value

        def _set_attrinfo(attr, attrv, container, is_recursive=False):
            attrinfo = {
                'name': attr.name,
                'type': attr.type,
                'key': '',
                'value': '',
                'referral_id': '',
            }

            # Convert data format for mapping of Elasticsearch according to the data type
            if attrv is None:
                # This is the processing to be safe even if the empty AttributeValue was passed.
                pass

            elif (attr.type & AttrTypeValue['string'] or attr.type & AttrTypeValue['text']):
                # When the value was date format, Elasticsearch detect it date type
                # automatically. This processing explicitly set value to the date typed
                # parameter.
                ret = is_date_check(attrv.value)
                if ret and isinstance(ret[1], date):
                    attrinfo['date_value'] = ret[1]
                else:
                    attrinfo['value'] = truncate(attrv.value)

            elif attr.type & AttrTypeValue['boolean']:
                attrinfo['value'] = str(attrv.boolean)

            elif attr.type & AttrTypeValue['date']:
                attrinfo['date_value'] = attrv.date

            elif attr.type & AttrTypeValue['named']:
                attrinfo['key'] = attrv.value

                if attrv.referral and attrv.referral.is_active:
                    attrinfo['value'] = truncate(attrv.referral.name)
                    attrinfo['referral_id'] = attrv.referral.id

            elif attr.type & AttrTypeValue['object']:
                if attrv.referral and attrv.referral.is_active:
                    attrinfo['value'] = truncate(attrv.referral.name)
                    attrinfo['referral_id'] = attrv.referral.id

            elif attr.type & AttrTypeValue['group']:
                if attrv.value:
                    group = Group.objects.filter(id=attrv.value, is_active=True).first()
                    if group:
                        attrinfo['value'] = truncate(group.name)
                        attrinfo['referral_id'] = group.id

            # Basically register attribute information whatever value doesn't exist
            if not (attr.type & AttrTypeValue['array'] and not is_recursive):
                container.append(attrinfo)

            elif attr.type & AttrTypeValue['array'] and not is_recursive and attrv is not None:
                # Here is the case of parent array, set each child values
                [_set_attrinfo(attr, x, container, True) for x in attrv.data_array.all()]

                # If there is no value in container,
                # this set blank value for maching blank search request
                if not [x for x in container if x['name'] == attr.name]:
                    container.append(attrinfo)

        document = {
            'entity': {'id': self.schema.id, 'name': self.schema.name},
            'name': self.name,
            'attr': [],
        }

        # The reason why this is a beat around the bush processing is for the case that Attibutes
        # objects are not existed in attr parameter because of delay processing. If this entry
        # doesn't have an Attribute object associated with an EntityAttr, this registers blank
        # value to the Elasticsearch.
        for entity_attr in self.schema.attrs.filter(is_active=True):
            attrv = None

            attr = self.attrs.filter(schema=entity_attr)
            if attr:
                attrv = attr.first().get_latest_value()

            _set_attrinfo(entity_attr, attrv, document['attr'])

        return document

    def register_es(self, es=None, skip_refresh=False):
        if not es:
            es = ESS()

        es.index(doc_type='entry', id=self.id, body=self.get_es_document(es))
        if not skip_refresh:
            es.refresh()

    def unregister_es(self, es=None):
        if not es:
            es = ESS()

        es.delete(doc_type='entry', id=self.id, ignore=[404])
        es.refresh(ignore=[404])

    def get_value_history(self, user, count=CONFIG.MAX_HISTORY_COUNT, index=0):
        def _get_values(attrv):
            return {
                'attrv_id': attrv.id,
                'value': attrv.format_for_history(),
                'created_time': attrv.created_time,
                'created_user': attrv.created_user.username,
            }

        ret_values = []
        all_attrv = AttributeValue.objects.filter(
            parent_attr__in=self.attrs.all(),
            parent_attrv__isnull=True).order_by('-created_time')[index:]

        for (i, attrv) in enumerate(all_attrv):
            if (len(ret_values) >= count):
                break

            attr = attrv.parent_attr
            if (attr.is_active and
                    attr.schema.is_active and
                    user.has_permission(attr, ACLType.Readable) and
                    user.has_permission(attr.schema, ACLType.Readable)):

                # try to get next attrv
                next_attrv = None
                for _attrv in all_attrv[(i+1):]:
                    if _attrv.parent_attr == attr:
                        next_attrv = _attrv
                        break

                ret_values.append({
                    'attr_id': attr.id,
                    'attr_name': attr.schema.name,
                    'attr_type': attr.schema.type,
                    'curr': _get_values(attrv),
                    'prev': _get_values(next_attrv) if next_attrv else None,
                })

        return ret_values

    @classmethod
    def search_entries(kls, user, hint_entity_ids, hint_attrs=[], limit=CONFIG.MAX_LIST_ENTRIES,
                       entry_name=None, or_match=False, hint_referral=False):
        """Main method called from simple search and advanced search.

        Do the following:
        1. Create a query for Elasticsearch search. (make_query)
        2. Execute the created query. (execute_query)
        3. Search the reference entry,
           process the search results, and return. (make_search_results)

        Args:
            user (:obj:`str`, optional): User who executed the process
            hint_entity_ids (list(str)): Entity ID specified in the search condition input
            hint_attrs (list(dict[str, str])): Defaults to Empty list.
                A list of search strings and attribute sets
            limit (int): Defaults to 100.
                Maximum number of search results to return
            entry_name (str): Search string for entry name
            or_match (bool): Defaults to False.
                Flag to determine whether the simple search or advanced search is called
            hint_referral (str): Defaults to False.
                Input value used to refine the reference entry.
                Use only for advanced searches.

        Returns:
            dict[str, str]: As a result of the search,
                the acquired entry and the attribute value of the entry are returned.

        """
        results = {
            'ret_count': 0,
            'ret_values': []
        }

        query = make_query(hint_entity_ids, hint_attrs, entry_name, or_match)

        res = execute_query(query)

        if 'status' in res and res['status'] == 404:
            return results

        return make_search_results(results, res, hint_attrs, limit, hint_referral)

    @classmethod
    def get_all_es_docs(kls):
        return ESS().search(body={'query': {'match_all': {}}}, ignore=[404])

    @classmethod
    def is_importable_data(kls, data):
        """This method confirms import data has following data structure
        Entity:
            - name: entry_name
            - attrs:
                attr_name1: attr_value
                attr_name2: attr_value
                ...
        """
        if not isinstance(data, dict):
            return False

        if not all([isinstance(x, list) for x in data.values()]):
            return False

        for entry_data in sum(data.values(), []):
            if not isinstance(entry_data, dict):
                return False

            if not ('attrs' in entry_data and 'name' in entry_data):
                return False

            if not isinstance(entry_data['name'], str):
                return False

            if not isinstance(entry_data['attrs'], dict):
                return False

        return True

    def get_attrv(self, attr_name):
        """This returns specified attribute's value without permission check. Because
        this prioritizes performance (less frequency of sending query to Database) over
        authorization safety.

        CAUTION: Don't use this before permissoin check of specified attribute.
        """
        return AttributeValue.objects.filter(
            is_latest=True,
            parent_attr__name=attr_name,
            parent_attr__schema__is_active=True,
            parent_attr__parent_entry=self
        ).first()
